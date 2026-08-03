import { TestBed } from '@angular/core/testing';
import { DashboardTasksList } from './dashboard-tasks-list';

describe('DashboardTasksList', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardTasksList],
    }).compileComponents();
  });

  it('renders no outstanding tasks when the list is empty', () => {
    const fixture = TestBed.createComponent(DashboardTasksList);
    fixture.componentInstance.tasks = { status: 'ok', data: [] };
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No outstanding tasks');
  });

  it('renders real tasks', () => {
    const fixture = TestBed.createComponent(DashboardTasksList);
    fixture.componentInstance.tasks = { status: 'ok', data: ['Submit your next EI report'] };
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Submit your next EI report');
  });

  it('renders each task as a scds-multi-column-list listitem', () => {
    const fixture = TestBed.createComponent(DashboardTasksList);
    fixture.componentInstance.tasks = { status: 'ok', data: ['Submit your next EI report', 'Update your address'] };
    fixture.detectChanges();

    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('li[role="listitem"]');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Submit your next EI report');
  });

  it('degrades to an alert when tasks are unavailable', () => {
    const fixture = TestBed.createComponent(DashboardTasksList);
    fixture.componentInstance.tasks = { status: 'unavailable' };
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain(
      'temporarily unavailable',
    );
  });

  it('renders nothing while benefitOverview has not yet loaded', () => {
    const fixture = TestBed.createComponent(DashboardTasksList);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="alert"]')).toBeNull();
    expect(compiled.textContent).not.toContain('No outstanding tasks');
  });
});
