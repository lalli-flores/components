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
 * @returns {Array} Activities state and showLoader state
 */
export default function useActivityStream(roomID, elementRef) {
  const [activities, dispatch] = useReducer(reducer, []);
  const [showLoader, setShowLoader] = useState(false);
  const {roomsAdapter} = useContext(AdapterContext);

  const loadPreviousActivities = async () => {
    const previousActivities = await roomsAdapter.getPreviousRoomActivities(roomID);

    dispatch({type: PREPEND_ACTIVITIES, payload: previousActivities});
  };

  const handleScroll = async (event) => {
    // Only load more data when user has reached the top
    const isViewportTop = event.target.scrollTop === 0;

    if (!showLoader && isViewportTop && roomsAdapter.hasMoreActivities(roomID)) {
      setShowLoader(true);
      await loadPreviousActivities();
      setShowLoader(false);
    }
  };

  useEffect(() => {
    // If an element is passed in, bind scroll event
    const element = elementRef.current;

    if (element) {
      element.addEventListener('scroll', handleScroll);
    }

    // Load previous content if there is any
    loadPreviousActivities();

    const subscription = roomsAdapter.getRoomActivities(roomID).subscribe((activityData) => {
      dispatch({type: APPEND_ACTIVITIES, payload: activityData});
    });

    return () => {
      if (element) {
        element.removeEventListener('scroll', handleScroll);
      }

      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [activities, showLoader];
}
