import {Observable} from 'rxjs';

import RoomsAdapter from './RoomsAdapter';

/**
 * @typedef RoomJSON
 * @param {object} datasource An object that contains a set of rooms keyed by ID.
 * @example
 * {
 *  "room-1": {
 *     "ID": "room-1",
 *     "title": "title",
 *     "roomType": "group"
 *  },
 *  "room-1-activities": []
 * }
 */

/*
 * Implements the RoomsAdapter interface with a JSON object as its datasource. See @RoomsJSON
 */
export default class RoomsJSONAdapter extends RoomsAdapter {
  constructor(datasource) {
    super(datasource);

    this.dataChunkSize = 4;
  }

  /**
   * Returns an observable that emits room data of the given ID.
   *
   * @param {string} ID ID of room to get
   * @returns {Observable.<Room>}
   * @memberof RoomsJSONAdapter
   */
  getRoom(ID) {
    return Observable.create((observer) => {
      if (this.datasource[ID]) {
        observer.next(this.datasource[ID]);
      } else {
        observer.error(new Error(`Could not find room with ID "${ID}"`));
      }

      observer.complete();
    });
  }

  /**
   * Returns an observable that emits an array of current and future activities of the given roomID.
   *
   * @param {string} ID  ID of the room for which to get activities.
   * @returns {Observable.<Array.<string|ActivityDate>>}
   * @memberof RoomsJSONAdapter
   */
  getRoomActivities(ID) {
    return Observable.create((observer) => {
      const data = !this.datasource[`${ID}-activities`] ? [] : this.datasource[`${ID}-activities`];

      observer.next(data);

      observer.complete();
    });
  }

  /**
   * Returns a promise to an array of the next chunk of previous activity data
   * of the given roomID. If `hasMoreActivities` returns false, the promise
   * will return [].
   *
   * The next chunk is based on the adapter's `dataChunkSize`.
   *
   * @param {string} ID  ID of the room for which to get activities.
   * @returns {Promise.<Array.<string|ActivityDate>>}
   * @memberof RoomsJSONAdapter
   */
  getPreviousRoomActivities(ID) {
    let data = [];

    if (`${ID}-previous-activities` in this.datasource) {
      const startIndex = this.lastDataIndex[ID] ? this.lastDataIndex[ID] : 0;
      const endIndex = startIndex + this.dataChunkSize;

      data = this.datasource[`${ID}-previous-activities`].slice(startIndex, endIndex);
      this.lastDataIndex[ID] = endIndex;
    }

    return Promise.resolve(data);
  }

  /**
   * Returns `true` if there are more activities to load from the room of the given ID.
   * Otherwise, it returns `false`.
   *
   * @param {string} ID ID of the room for which to verify activities.
   * @returns {boolean}
   * @memberof RoomsJSONAdapter
   */
  hasMoreActivities(ID) {
    // If no data yet, initialize data index
    this.lastDataIndex[ID] = this.lastDataIndex[ID] ? this.lastDataIndex[ID] : 0;
    let result = false;

    if (`${ID}-previous-activities` in this.datasource) {
      result = this.lastDataIndex[ID] < this.datasource[`${ID}-previous-activities`].length;
    }

    return result;
  }
}
