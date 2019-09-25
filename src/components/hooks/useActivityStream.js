import 'core-js/stable';
import 'regenerator-runtime/runtime';

import {useContext, useEffect, useReducer, useState} from 'react';

import {AdapterContext} from '../../components/';

const PREPEND_ACTIVITIES = 'prepend_activities';
const APPEND_ACTIVITIES = 'append_activities';

/**
 * Returns a new array of activities based on the given action.
 * If no action is passed, it will return the same activities
 * array without any changes.
 *
 * @param {Array.<string|ActivityDate>} activities activities associated to the room
 * @param {object} action action to apply to given activities
 * @returns {Array.<string|ActivityDate>}
 */
function reducer(activities, action) {
  let newActivities = [];

  switch (action.type) {
    case PREPEND_ACTIVITIES:
      newActivities = action.payload.reverse().concat(activities);
      break;
    case APPEND_ACTIVITIES:
      newActivities = activities.concat(action.payload);
      break;
    default:
      newActivities = activities;
      break;
  }

  return newActivities;
}

/**
 * Custom hook that returns activity data associated to the room of the given ID.
 * If an element reference is given, it will attach an scroll listener to load more
 * data as user scrolls to top.
 *
 * @param {string} roomID  ID of the room for which to return data.
 * @param {object} elementRef  reference to the element to attach scroll listener.
 * @param {object} lastElementRef  reference to the last element within elementRef
 * @returns {Array} Activities state and showLoader state
 */
export default function useActivityStream(roomID, elementRef, lastElementRef) {
  const [activities, dispatch] = useReducer(reducer, []);
  const [showLoader, setShowLoader] = useState(false);
  const [scrollToLastActivity, setScrollToLastActivity] = useState(true);
  const {roomsAdapter} = useContext(AdapterContext);

  const loadPreviousActivities = async () => {
    const previousActivities = await roomsAdapter.getPreviousRoomActivities(roomID);

    dispatch({type: PREPEND_ACTIVITIES, payload: previousActivities});
  };

  const handleScroll = (event) => {
    // Only load more data when user has reached the top
    const isViewportTop = event.target.scrollTop === 0;

    if (!showLoader && isViewportTop && roomsAdapter.hasMoreActivities(roomID)) {
      setShowLoader(true);

      // Throttle scroll
      setTimeout(async () => {
        await loadPreviousActivities();
        setShowLoader(false);
      }, 500);
    }
  };

  // Keep requesting previous activities until activity stream is filled
  useEffect(() => {
    const activityStreamBoundaries = elementRef.current.getBoundingClientRect();
    const lastActivityBoundaries = lastElementRef.current.getBoundingClientRect();
    const hasMoreActivities = roomsAdapter.hasMoreActivities(roomID);

    if (lastActivityBoundaries.bottom < activityStreamBoundaries.bottom) {
      // If there are more activities, load them
      if (hasMoreActivities) {
        loadPreviousActivities();
        // if there are no more activities to load, scroll to last activity
      } else {
        lastElementRef.current.scrollIntoView();
        setScrollToLastActivity(false);
      }
    } else {
      // Scroll to bottom once after loading enough content
      // eslint-disable-next-line no-lonely-if
      if (scrollToLastActivity) {
        lastElementRef.current.scrollIntoView();
        setScrollToLastActivity(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities]);

  // Attach scroll event listener and subscribe to future updates on load
  useEffect(() => {
    // If an element is passed in, bind scroll event
    const element = elementRef.current;

    if (element) {
      element.addEventListener('scroll', handleScroll);
    }

    const subscription = roomsAdapter.getRoomActivities(roomID).subscribe((activityData) => {
      dispatch({type: APPEND_ACTIVITIES, payload: activityData});
    });

    return () => {
      // Reset previous index count since component unmounts
      // It will run all hooks again
      roomsAdapter.lastDataIndex[roomID] = 0;

      if (element) {
        element.removeEventListener('scroll', handleScroll);
      }

      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [activities, showLoader];
}
