import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';
import { MockInventoryService } from 'src/testing/inventory.service.mock';
import { InventoryListComponent } from './inventory_list.component';
import { InventoryItem } from './inventory_item';
import { InventoryService } from './inventory.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('Inventory list', () => {
  let inventoryList: InventoryListComponent;
  let fixture: ComponentFixture<InventoryListComponent>;
  let inventoryService: InventoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InventoryListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: InventoryService, useClass: MockInventoryService },
        provideRouter([])
      ],
    });
  });

  beforeEach(waitForAsync(() => {
    TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(InventoryListComponent);
      inventoryList = fixture.componentInstance;
      inventoryService = TestBed.inject(InventoryService);
      fixture.detectChanges();
    });
  }));

  it('should create the component', () => {
    expect(inventoryList).toBeTruthy();
  });

  it('should initialize with serverFilteredItems available', () => {
    const items = inventoryList.serverFilteredItems();
    expect(items).toBeDefined();
    expect(Array.isArray(items)).toBe(true);
  });

  it('should initialize with filteredItems available', () => {
    const items = inventoryList.filteredItems();
    expect(items).toBeDefined();
    expect(Array.isArray(items)).toBe(true);
  });

  it('should initialize with typeFilteredItems available', () => {
    const typedItems = inventoryList.typeFilteredItems();
    expect(typedItems).toBeDefined();
    expect(Array.isArray(typedItems)).toBe(true);
  });

  it('should call getItems() and updateSavedSearch() when itemName signal changes', () => {
    const spy = spyOn(inventoryService, 'getItems').and.callThrough();
    const doubleAgent = spyOn(inventoryService, 'updateSavedSearch').and.callThrough();
    inventoryList.itemName.set('test');
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith({  }); //Since we're not filtering on server, no arguements should be passed.
    expect(doubleAgent).toHaveBeenCalled();
  });

  //Current setup just calls getItems when anything changes. Probably a better way to test this.
  // it('should call getUsers() when userAge signal changes', () => {
  //   const spy = spyOn(userService, 'getUsers').and.callThrough();
  //   userList.userAge.set(25);
  //   fixture.detectChanges();
  //   expect(spy).toHaveBeenCalledWith({ role: undefined, age: 25 });
  // });

  it('should not show error message on successful load', () => {
    expect(inventoryList.errMsg()).toBeUndefined();
  });

  it("correctly handles the 'Location Reset' button", () => {
    expect(inventoryList.resetVisible()).toEqual(false);
    inventoryList.revealReset();
    expect(inventoryList.resetVisible()).toEqual(true);
  });

  it("calls the service with correct parameters for location reset", () => {
    const spy = spyOn(inventoryService, 'modifyMass').and.callThrough();
    const originalItems = inventoryList.filteredItems();
    inventoryList.resetLocations();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledOnceWith(
      {
        _id:undefined,
        location:"N/A",
        stocked:undefined,
        name:undefined,
        type:undefined,
        desc:undefined,
        pack:undefined
      },
      originalItems
    );
  });

  it('refetches items after location reset completes', () => {
    const getItemsSpy = spyOn(inventoryService, 'getItems').and.callThrough();
    spyOn(inventoryService, 'modifyMass').and.returnValue(of(void 0));

    const callsBeforeReset = getItemsSpy.calls.count();
    inventoryList.resetLocations();
    fixture.detectChanges();

    expect(getItemsSpy.calls.count()).toBeGreaterThan(callsBeforeReset);
  });

  it('does not relocate when prompt is cancelled', () => {
    spyOn(window, 'prompt').and.returnValue(null);
    const modifySpy = spyOn(inventoryService, 'modifyMass').and.returnValue(of(void 0));

    inventoryList.relocateSelected();

    expect(modifySpy).not.toHaveBeenCalled();
  });

  it('relocates selected items and clears selection on completion', () => {
    spyOn(inventoryService, 'filterItems').and.callFake((items) => items);
    inventoryList.itemName.set('pencil');
    fixture.detectChanges();
    const selectedId = inventoryList.filteredItems()[0]._id;
    inventoryList.selectedItems.set(new Set([selectedId]));
    spyOn(window, 'prompt').and.returnValue('Shelf A');
    const modifySpy = spyOn(inventoryService, 'modifyMass').and.returnValue(of(void 0));

    inventoryList.relocateSelected();
    fixture.detectChanges();

    expect(modifySpy).toHaveBeenCalled();
    const modifiedItems = modifySpy.calls.mostRecent().args[1] as InventoryItem[];
    expect(modifiedItems.length).toBe(1);
    expect(modifiedItems[0]._id).toBe(selectedId);
    expect(inventoryList.selectedItems().size).toBe(0);
  });
});

describe('Misbehaving Item List', () => {
  let itemList: InventoryListComponent;
  let fixture: ComponentFixture<InventoryListComponent>;

  let inventoryServiceStub: {
    getItems: () => Observable<InventoryItem[]>;
    filterItems: () => InventoryItem[];
    updateSavedSearch: () => undefined;
    typeOptions: { value: string; label: string }[];
    modifyMass: () => Observable<void>;
  };

  beforeEach(() => {
    // stub UserService for test purposes
    inventoryServiceStub = {
      getItems: () =>
        new Observable((observer) => {
          observer.error('getItems() Observer generates an error');
        }),
      filterItems: () => [],
      updateSavedSearch: () => undefined,
      typeOptions: [],
      modifyMass: () => of(void 0)
    };
  });

  // Construct the `userList` used for the testing in the `it` statement
  // below.
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        InventoryListComponent
      ],
      // providers:    [ UserService ]  // NO! Don't provide the real service!
      // Provide a test-double instead
      providers: [{
        provide: InventoryService,
        useValue: inventoryServiceStub
      }, provideRouter([])],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryListComponent);
    itemList = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("generates an error if we don't set up an InventoryListService", () => {
    // If the service fails, we expect the `serverFilteredUsers` signal to
    // be an empty array of users.
    expect(itemList.serverFilteredItems())
      .withContext("service can't give values to the list if it's not there")
      .toEqual([]);
    // We also expect the `errMsg` signal to contain the "Problem contacting…"
    // error message. (It's arguably a bit fragile to expect something specific
    // like this; maybe we just want to expect it to be non-empty?)
    expect(itemList.errMsg())
      .withContext('the error message will be')
      .toContain('Problem contacting the server – Error Code:');
  });
});
