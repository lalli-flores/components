import rooms from './../data/rooms';
import RoomsJSONAdapter from './RoomsJSONAdapter';

describe('Rooms JSON Adapter Interface', () => {
  let roomsJSONAdapter, roomID;

  beforeEach(() => {
    [roomID] = Object.keys(rooms);
    roomsJSONAdapter = new RoomsJSONAdapter(rooms);
  });

  test('getRoom() returns an observable', () => {
    expect(rxjs.isObservable(roomsJSONAdapter.getRoom())).toBeTruthy();
  });

  test('getRoom() returns a room data', (done) => {
    roomsJSONAdapter.getRoom(roomID).subscribe((data) => {
      expect(data).toEqual(rooms[roomID]);
      done();
    });
  });

  test('getRoom() throws a proper error message', (done) => {
    const wrongRoomID = 'wrongRoomID';

    roomsJSONAdapter.getRoom(wrongRoomID).subscribe(
      () => {},
      (error) => {
        expect(error.message).toBe(`Could not find room with ID "${wrongRoomID}"`);
        done();
      }
    );
  });

  test('getRoom() completes the observable', (done) => {
    roomsJSONAdapter.getRoom(roomID).subscribe(
      () => {},
      () => {},
      () => {
        expect(true).toBeTruthy();
        done();
      }
    );
  });

  test('getRoomActivities() returns an observable', () => {
    expect(rxjs.isObservable(roomsJSONAdapter.getRoomActivities())).toBeTruthy();
  });

  test('getRoomActivities() returns an array of previous activity IDs', (done) => {
    roomsJSONAdapter.getRoomActivities(roomID).subscribe((data) => {
      expect(data).toEqual(rooms[`${roomID}-activities`]);
      done();
    });
  });

  test('getRoomActivities() returns an observable to an empty array for a given wrong room ID', (done) => {
    const wrongRoomActivitiesID = 'wrongRoomActivitiesID';

    roomsJSONAdapter.getRoomActivities(wrongRoomActivitiesID).subscribe((data) => {
      expect(data).toEqual([]);
      done();
    });
  });

  test('getRoomActivities() returns objects with a date parameter for time rulers', (done) => {
    const timeRulerRoomID = 'time-rulers';

    roomsJSONAdapter.getRoomActivities(timeRulerRoomID).subscribe((data) => {
      expect(data[0].date).toBeDefined();
      done();
    });
  });

  test('getRoomActivities() completes the observable', (done) => {
    roomsJSONAdapter.getRoomActivities(roomID).subscribe(
      () => {},
      () => {},
      () => {
        expect(true).toBeTruthy();
        done();
      }
    );
  });

  test('getPreviousRoomActivities() returns an array of previous activity IDs', async () => {
    const data = await roomsJSONAdapter.getPreviousRoomActivities(roomID);

    expect(data).toEqual(rooms[`${roomID}-previous-activities`]);
  });

  test('getPreviousRoomActivities() returns an empty array for a given wrong room ID', async () => {
    const wrongRoomActivitiesID = 'wrongRoomActivitiesID';
    const data = await roomsJSONAdapter.getPreviousRoomActivities(wrongRoomActivitiesID);

    expect(data).toEqual([]);
  });

  test('hasMoreActivities() returns true if room has more activities to load', () => {
    roomsJSONAdapter.lastDataIndex[roomID] = 2; // Arbitrary small number

    expect(roomsJSONAdapter.hasMoreActivities(roomID)).toBeTruthy();
  });

  test('hasMoreActivities() returns false if the room has no more activities to load', () => {
    // Larger than the total
    roomsJSONAdapter.lastDataIndex[roomID] = rooms[`${roomID}-previous-activities`].length + 1;

    expect(roomsJSONAdapter.hasMoreActivities(roomID)).toBeFalsy();
  });

  afterEach(() => {
    roomsJSONAdapter = null;
  });
});
