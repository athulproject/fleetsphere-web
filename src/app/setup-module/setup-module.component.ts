import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../commonComponents/breadcrumb/breadcrumb';
import {
  LucideSlidersHorizontal,
  LucideUsers,
  LucideClock,
  LucideDollarSign,
  LucideCalendar,
  LucideTruck,
  LucideGrid3X3,
  LucideFileText,
  LucideSettings,
} from '@lucide/angular';

export interface SetupCard {
  title: string;
  route: string;
  badge?: string;
  description?: string;
}

export interface SetupTab {
  id: string;
  label: string;
  iconName: string;
  iconColorClass: string;
  cards: SetupCard[];
}

@Component({
  selector: 'app-setup-module',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbComponent,
    LucideSlidersHorizontal,
    LucideUsers,
    LucideClock,
    LucideDollarSign,
    LucideCalendar,
    LucideTruck,
    LucideGrid3X3,
    LucideFileText,
    LucideSettings,
  ],
  templateUrl: './setup-module.component.html',
  styleUrl: './setup-module.component.css',
})
export class SetupModuleComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  role = computed(() => this.authService.primaryRole());

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Options' },
    { label: 'Setup Module' },
  ];

  // Active Tab state (defaults to 'controls' matching user screenshot)
  activeTabId = signal<string>('controls');

  // Search filter
  searchQuery = signal<string>('');

  // Setup tabs and their sub-cards matching user's architecture
  setupTabs = computed<SetupTab[]>(() => {
    const r = this.role();
    return [
      {
        id: 'controls',
        label: 'Controls',
        iconName: 'SlidersHorizontal',
        iconColorClass: 'text-blue-500',
        cards: [
          {
            title: 'Control Panel Setting',
            route: `/${r}/ctrl_panel`,
            description: 'Central dynamic module operational policies and rule manager',
          },
          {
            title: 'User Control Setting',
            route: `/${r}/ctrl_panel?module=user_management`,
            description: 'Auto-code prefix, length, manual override, and employee validation',
          },
          {
            title: 'Attendance Control Setting',
            route: `/${r}/ctrl_panel?module=attendance`,
            description: 'Geofencing radius, clock-in grace interval, and biometric policy',
          },
          {
            title: 'Payroll Control Setting',
            route: `/${r}/ctrl_panel?module=payroll`,
            description: 'Disbursement frequency, monthly cutoff, and overtime multipliers',
          },
          {
            title: 'Fleet & Dispatch Setting',
            route: `/${r}/ctrl_panel?module=fleet_dispatch`,
            description: 'Pre-trip safety checklists, speed alerts, and GPS polling rates',
          },
          {
            title: 'Documents Control Setting',
            route: `/${r}/ctrl_panel?module=documents`,
            description: 'Advance licence expiry warnings and dispatch safety blocks',
          },
        ],
      },
      {
        id: 'user_setups',
        label: 'User & Employee Setups',
        iconName: 'Users',
        iconColorClass: 'text-amber-500',
        cards: [
          {
            title: 'User Management Directory',
            route: `/${r}/user-management`,
            description: 'Staff operational accounts and access lifecycle',
          },
          {
            title: 'Employee Master Setup',
            route: `/${r}/master/employee-master`,
            description: 'Enterprise staff directory and employment profiles',
          },
          {
            title: 'Designation Master Setup',
            route: `/${r}/master/designation`,
            description: 'Workplace job titles and organizational roles',
          },
          {
            title: 'Department Master Setup',
            route: `/${r}/master/department`,
            description: 'Functional corporate and logistics divisions',
          },
          {
            title: 'Employee Type Setup',
            route: `/${r}/master/employee-type`,
            description: 'Permanent, contract, and temporary classifications',
          },
          {
            title: 'Reporting Structure Setup',
            route: `/${r}/master/reporting-structure`,
            description: 'Managerial reporting relationships and supervisors',
          },
        ],
      },
      {
        id: 'attendance_setups',
        label: 'Attendance & Shift Setups',
        iconName: 'Clock',
        iconColorClass: 'text-emerald-500',
        cards: [
          {
            title: 'Attendance Tracker Setup',
            route: `/${r}/attendance`,
            description: 'Daily workforce punch records and shift trackers',
          },
          {
            title: 'Shift Master Setup',
            route: `/${r}/master/shift`,
            description: 'Work shifts, day/night express hours, and timings',
          },
          {
            title: 'Calendar & Schedules Setup',
            route: `/${r}/calendar`,
            description: 'Rosters, shift rotations, and holiday schedules',
          },
        ],
      },
      {
        id: 'expense_setups',
        label: 'Expense & Payroll Module',
        iconName: 'DollarSign',
        iconColorClass: 'text-violet-500',
        cards: [
          {
            title: 'Payroll Summary Setup',
            route: `/${r}/payroll`,
            description: 'Salary calculations and disbursement processing',
          },
          {
            title: 'Trip Expense & Fuel Setup',
            route: `/${r}/payroll`,
            description: 'Fleet driver allowances and trip disbursement rules',
          },
        ],
      },
      {
        id: 'leave_setups',
        label: 'Leave & Calendar Modules',
        iconName: 'Calendar',
        iconColorClass: 'text-orange-500',
        cards: [
          {
            title: 'Leave Policy Setup',
            route: `/${r}/calendar`,
            description: 'Annual leave accruals, casual leave, and holidays',
          },
          {
            title: 'Holiday Calendar Setup',
            route: `/${r}/calendar`,
            description: 'Statutory regional and national holiday schedules',
          },
        ],
      },
      {
        id: 'fleet_setups',
        label: 'Branch & Fleet Setups',
        iconName: 'Truck',
        iconColorClass: 'text-sky-500',
        cards: [
          {
            title: 'Branch / Depot Master',
            route: `/${r}/master/branch`,
            description: 'Operational logistics yards, branches, and depots',
          },
          {
            title: 'Warehouse / Hub Master',
            route: `/${r}/master/hub`,
            description: 'Sorting centers, storage hubs, and transfer yards',
          },
          {
            title: 'City & Regional Area Setups',
            route: `/${r}/master/city`,
            description: 'Metropolitan delivery clusters and postal towns',
          },
        ],
      },
      {
        id: 'mapping_setups',
        label: 'Mapping & Security Setups',
        iconName: 'Grid3X3',
        iconColorClass: 'text-rose-500',
        cards: [
          {
            title: 'Menu Master & Role Mapping',
            route: `/${r}/master/menus`,
            description: 'Sidebar 8-menu default visibility and role permissions',
          },
          {
            title: 'Organizational Hierarchy Tree',
            route: `/${r}/master/hierarchy`,
            description: 'Visual multi-level enterprise organization tree',
          },
        ],
      },
      {
        id: 'document_setups',
        label: 'Document & Compliance Setups',
        iconName: 'FileText',
        iconColorClass: 'text-teal-500',
        cards: [
          {
            title: 'Document Type Master',
            route: `/${r}/master/document-type`,
            description: 'Commercial driving licences, permits, and ID proofs',
          },
          {
            title: 'Skill & Certification Master',
            route: `/${r}/master/skill`,
            description: 'HCV certifications, HAZMAT, and driver qualifications',
          },
        ],
      },
    ];
  });

  // Current active tab object
  activeTab = computed(() => {
    return this.setupTabs().find((t) => t.id === this.activeTabId()) || this.setupTabs()[0];
  });

  // Filtered cards based on active tab and search query
  filteredActiveCards = computed<SetupCard[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const tab = this.activeTab();
    if (!tab) return [];

    if (!q) {
      return tab.cards;
    }

    // When search is active, search within the active tab
    return tab.cards.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  });

  // All cards across all tabs matching search (used if search has results across other tabs)
  allMatchingCards = computed<Array<SetupCard & { tabLabel: string; tabId: string }>>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return [];
    const results: Array<SetupCard & { tabLabel: string; tabId: string }> = [];

    for (const tab of this.setupTabs()) {
      for (const card of tab.cards) {
        if (
          card.title.toLowerCase().includes(q) ||
          (card.description && card.description.toLowerCase().includes(q))
        ) {
          results.push({
            ...card,
            tabLabel: tab.label,
            tabId: tab.id,
          });
        }
      }
    }
    return results;
  });

  ngOnInit(): void {}

  selectTab(tabId: string): void {
    this.activeTabId.set(tabId);
  }

  navigateTo(route: string): void {
    this.router.navigateByUrl(route);
  }
}
