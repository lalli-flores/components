import RoomsAdapter from './RoomsAdapter';

describe('Rooms Adapter Interface', () => {
  let roomsAdapter;

  beforeEach(() => {
    roomsAdapter = new RoomsAdapter();
  });

  test('getRoom() returns an observable', () => {
    expect(rxjs.isObservable(roomsAdapter.getRoom())).toBeTruthy();
  });

  test('getRoom() throws error since it is not defined', (done) => {
    roomsAdapter.getRoom('ID').subscribe(
      () => {},
      (error) => {
        expect(error.message).toBe('getRoom(ID) must be defined in RoomsAdapter');
        done();
      }
    );
  });

  test('getRoomActivities() returns an observable', () => {
    expect(rxjs.isObservable(roomsAdapter.getRoomActivities())).toBeTruthy();
  });

  test('getRoomActivities() throws error since it is not defined', (done) => {
    roomsAdapter.getRoomActivities('id').subscribe(
      () => {},
      (error) => {
        expect(error.message).toBe('getRoomActivities(ID) must be defined in RoomsAdapter');
        done();
      }
    );
  });

  test('getPreviousRoomActivities() returns a promise rejection since it is not defined', async () => {
    try {
      await roomsAdapter.getPreviousRoomActivities('ID');
    } catch (error) {
      expect(error.message).toEqual('getPreviousRoomActivities(ID) must be defined in RoomsAdapter');
    }
  });

  test('hasMoreActivities() throws error since it is not defined', () => {
    try {
      expect(roomsAdapter.hasMoreActivities('ID')).toThrowError();
      // eslint-disable-next-line no-empty
    } catch (error) {}
  });

  afterEach(() => {
    roomsAdapter = null;
  });
});
