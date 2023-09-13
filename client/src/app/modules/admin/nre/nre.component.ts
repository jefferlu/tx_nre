import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { Workbook, Worksheet } from 'exceljs';
import * as fs from 'file-saver';
import * as dayjs from 'dayjs';

import { NreService } from './nre.service';
import { Observable, Subject, debounceTime, filter, map, startWith, takeUntil } from 'rxjs';
import { SpecialAlpha } from 'app/core/validators/special-alpha';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { fuseAnimations } from '@fuse/animations';
import { VersionDuplicate } from 'app/core/validators/version-duplicate';
import { AlertService } from 'app/layout/common/alert/alert.service';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';


@Component({
    selector: 'app-nre',
    templateUrl: './nre.component.html',
    styleUrls: ['./nre.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NreComponent implements OnInit {

    @ViewChild('drawer') drawer: MatDrawer;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    drawerMode: 'over' | 'side' = 'side';
    drawerOpened: boolean = true;
    panels: any[] = [];
    selectedPanel: string = 'overview';

    project: any = null;


    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseMediaWatcherService: FuseMediaWatcherService
    ) { }

    ngOnInit(): void {
        // Setup available panels
        this.panels = [
            {
                id: 'overview',
                icon: '',
                title: 'Overview',
                description: ''
            }
        ];

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {

                // Set the drawerMode and drawerOpened
                if (matchingAliases.includes('lg')) {
                    this.drawerMode = 'side';
                    this.drawerOpened = true;
                }
                else {
                    this.drawerMode = 'over';
                    this.drawerOpened = false;
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    getProject(project: any) {
        this.project = project;

        if (this.panels.length == 1) {
            // this.panels.push({ id: 'project', title: project.name, })
            this.panels.push({ id: 'project', title: 'Project', });           
        }
        // else {
        //     this.panels[1].title = project.name;
        // }

        this.goToPanel('project');
    }

    goToPanel(panel: string): void {
        this.selectedPanel = panel;

        // Close the drawer on 'over' mode
        if (this.drawerMode === 'over') {
            this.drawer.close();
        }
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}