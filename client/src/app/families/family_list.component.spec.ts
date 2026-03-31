import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
//import { Observable } from 'rxjs';
import { MockFamilyService } from 'src/testing/family.service.mock';
import { FamilyListComponent } from './family_list.component';
import { FamilyService } from './family.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('Family list', () => {
  let familyList: FamilyListComponent;
  let fixture: ComponentFixture<FamilyListComponent>;
  let familyService: FamilyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FamilyListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: FamilyService, useClass: MockFamilyService },
        provideRouter([])
      ],
    });
  });

  beforeEach(waitForAsync(() => {
    TestBed.compileComponents().then(() => {
      fixture = TestBed.createComponent(FamilyListComponent);
      familyList = fixture.componentInstance;
      familyService = TestBed.inject(FamilyService);
      fixture.detectChanges();
    });
  }));

  it('should create the component', () => {
    expect(familyList).toBeTruthy();
  });

  it('should initialize with serverFilteredFamilies available', () => {
    const items = familyList.serverFilteredItems();
    expect(items).toBeDefined();
    expect(Array.isArray(items)).toBe(true);
  });

  it('should initialize with filteredFamilies available', () => {
    const items = familyList.filteredFamilies();
    expect(items).toBeDefined();
    expect(Array.isArray(items)).toBe(true);
  });

  it('should initialize with gradeFilteredItems available', () => {
    const gradedItems = familyList.gradeFilteredFamilies();
    expect(gradedItems).toBeDefined();
    expect(Array.isArray(gradedItems)).toBe(true);
  });

  it('should initialize with schoolFilteredFamilies available', () => {
    const schooledItems = familyList.schoolFilteredFamilies();
    expect(schooledItems).toBeDefined();
    expect(Array.isArray(schooledItems)).toBe(true);
  });

  it('should call getFamilies() and updateSavedSearch() when itemName signal changes', () => {
    const spy = spyOn(familyService, 'getFamilies').and.callThrough();
    const doubleAgent = spyOn(familyService, 'updateSavedSearch').and.callThrough();
    familyList.itemName.set('test');
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith({  }); //Since we're not filtering on server, no arguements should be passed.
    expect(doubleAgent).toHaveBeenCalled();
  });

  it('should not show error message on successful load', () => {
    expect(familyList.errMsg()).toBeUndefined();
  });

  it("correctly handles the 'Location Reset' button", () => {
    expect(familyList.resetVisible()).toEqual(false);
    familyList.revealReset();
    expect(familyList.resetVisible()).toEqual(true);
  });

  //Irellevant, eventually add a test for list clear.

  // it("calls the service with correct parameters for location reset", () => {
  //   const spy = spyOn(inventoryService, 'modifyMass').and.callThrough();
  //   const originalItems = inventoryList.filteredItems();
  //   inventoryList.resetLocations();
  //   fixture.detectChanges();
  //   expect(spy).toHaveBeenCalledOnceWith(
  //     {
  //       _id:undefined,
  //       location:"N/A",
  //       stocked:undefined,
  //       name:undefined,
  //       type:undefined,
  //       desc:undefined
  //     },
  //     originalItems
  //   );
  // });
});
