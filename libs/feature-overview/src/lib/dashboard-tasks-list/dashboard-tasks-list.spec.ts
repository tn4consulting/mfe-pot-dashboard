import { TestBed } from '@angular/core/testing';
import { DashboardTasksList } from './dashboard-tasks-list';

// scds-multi-column-list renders into its own shadow DOM (a real custom
// element, not an Angular template), so its content isn't reachable via
// the host fixture's plain textContent/querySelector -- both need to go
// through the element's shadowRoot instead. The custom element's own
// render also happens on a microtask/macrotask tick outside Angular's
// change detection, hence the await.
function waitForRender(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

describe('DashboardTasksList', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardTasksList],
    }).compileComponents();
  });

  it('renders no outstanding tasks when the list is empty', async () => {
    const fixture = TestBed.createComponent(DashboardTasksList);
    fixture.componentInstance.tasks = { status: 'ok', data: [] };
    fixture.detectChanges();
    await waitForRender();

    const list = (fixture.nativeElement as HTMLElement).querySelector('scds-multi-column-list');
    expect(list?.shadowRoot?.textContent).toContain('No outstanding tasks');
  });

  it('renders real tasks', async () => {
    const fixture = TestBed.createComponent(DashboardTasksList);
    fixture.componentInstance.tasks = { status: 'ok', data: ['Submit your next EI report'] };
    fixture.detectChanges();
    await waitForRender();

    const list = (fixture.nativeElement as HTMLElement).querySelector('scds-multi-column-list');
    expect(list?.shadowRoot?.textContent).toContain('Submit your next EI report');
  });

  it('renders each task as a scds-multi-column-list listitem', async () => {
    const fixture = TestBed.createComponent(DashboardTasksList);
    fixture.componentInstance.tasks = { status: 'ok', data: ['Submit your next EI report', 'Update your address'] };
    fixture.detectChanges();
    await waitForRender();

    const list = (fixture.nativeElement as HTMLElement).querySelector('scds-multi-column-list');
    const rows = list?.shadowRoot?.querySelectorAll('li[role="listitem"]') ?? [];
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
