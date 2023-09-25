import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { AlertService } from 'app/layout/common/alert/alert.service';
import { SettingsService } from '../settings.service';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AccountDialogComponent } from './dialog/dialog.component';

@Component({
    selector: 'settings-account',
    templateUrl: './account.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsAccountComponent implements OnInit {

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    users: any = null;

    members: any[];
    roles: any[];

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _matDialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService,
        private _alert: AlertService,
        private _settingService: SettingsService
    ) {
    }

    ngOnInit(): void {
        this._settingService.users$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {
                this.users = res;
                this._changeDetectorRef.markForCheck();
            });

        // Setup the roles
        this.roles = [
            {
                label: 'User',
                value: false,
            },
            {
                label: 'Admin',
                value: true,
            }
        ];

        // Setup the team members
        this.members = [
            {
                avatar: 'assets/images/avatars/male-01.jpg',
                name: 'Dejesus Michael',
                email: 'dejesusmichael@mail.org',
                role: 'admin'
            },
            {
                avatar: 'assets/images/avatars/male-03.jpg',
                name: 'Mclaughlin Steele',
                email: 'mclaughlinsteele@mail.me',
                role: 'admin'
            },
            {
                avatar: 'assets/images/avatars/female-02.jpg',
                name: 'Laverne Dodson',
                email: 'lavernedodson@mail.ca',
                role: 'write'
            },
            {
                avatar: 'assets/images/avatars/female-03.jpg',
                name: 'Trudy Berg',
                email: 'trudyberg@mail.us',
                role: 'read'
            },
            {
                avatar: 'assets/images/avatars/male-07.jpg',
                name: 'Lamb Underwood',
                email: 'lambunderwood@mail.me',
                role: 'read'
            },
            {
                avatar: 'assets/images/avatars/male-08.jpg',
                name: 'Mcleod Wagner',
                email: 'mcleodwagner@mail.biz',
                role: 'read'
            },
            {
                avatar: 'assets/images/avatars/female-07.jpg',
                name: 'Shannon Kennedy',
                email: 'shannonkennedy@mail.ca',
                role: 'read'
            }
        ];

    }

    openDialog(user: any = {}): void {
        this._matDialog.open(AccountDialogComponent, {
            autoFocus: false,
            data: {
                user: user
            }
        });
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
