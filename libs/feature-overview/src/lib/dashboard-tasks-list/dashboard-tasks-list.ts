import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GcdsComponentsModule } from '@gcds-core/components-angular';
import { UpstreamResult } from 'dashboard-data-access';

@Component({
  selector: 'lib-dashboard-tasks-list',
  imports: [CommonModule, GcdsComponentsModule],
  templateUrl: './dashboard-tasks-list.html',
  styleUrl: './dashboard-tasks-list.css',
})
export class DashboardTasksList {
  @Input() tasks: UpstreamResult<string[]> | null = null;
}
