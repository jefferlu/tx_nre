import { OnInit, ChangeDetectionStrategy, Component, ViewEncapsulation, ChangeDetectorRef, Inject } from '@angular/core';
import { SettingsService } from '../../settings.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { FuseValidators } from '@fuse/validators';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { AlertService } from 'app/layout/common/alert/alert.service';

@Component({
    selector: 'app-dialog',
    templateUrl: './dialog.component.html',
    styleUrls: ['./dialog.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountDialogComponent implements OnInit {

    form: UntypedFormGroup;
    roles: any[];
    user: any;

    constructor(
        @Inject(MAT_DIALOG_DATA) private _data: any,
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder,
        private _matDialogRef: MatDialogRef<AccountDialogComponent>,
        private _fuseConfirmationService: FuseConfirmationService,
        private _alert: AlertService,
        private _settingService: SettingsService,
    ) { }

    ngOnInit(): void {
        this.user = this._data.user;
        if (!this.user.is_staff) this.user.is_staff = false;

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

        this.form = this._formBuilder.group({
            username: [this.user.username, [Validators.required]],
            email: [this.user.email, [Validators.required, Validators.email]],
            is_staff: [this.user.is_staff],
            password: [''],
            password2: [''],
        }, { validators: FuseValidators.mustMatch('password', 'password2') });

        // 控制密碼欄位是否必填
        if (!this.user.id) {
            this.form.get('password').setValidators([Validators.required]);
            this.form.get('password2').setValidators([Validators.required]);
            // 更新表單
            this.form.get('password').updateValueAndValidity();
            this.form.get('password2').updateValueAndValidity();
        }

        // if (this.user.id) this.form.get('email').disable();
    }

    onSave(): void {
        let request: any;
        if (this.form.invalid) return;

        if (this.user.id) {
            // Update
            request = {
                id: this.user.id,
                username: this.form.get('username').value,
                email: this.form.get('email').value,
                is_staff: this.form.get('is_staff').value
            };

            if (this.form.get('password').value)
                request.password = this.form.get('password').value

            this._settingService.updateUser(request).subscribe({
                next: (res) => {
                    if (res) {
                        this._alert.open({ message: 'The user has been created.' });
                        this._matDialogRef.close();
                    }
                },
                error: e => {
                    console.log(e)
                    let message = JSON.stringify(e.message);
                    if (e.error) message = JSON.stringify(e.error);
                    const dialogRef = this._fuseConfirmationService.open({
                        icon: { color: 'warn' },
                        title: `Error`,
                        message: message,
                        actions: { confirm: { color: 'primary' }, cancel: { show: false } }
                    });
                }
            });

        } else {
            // Create
            request = this.form.value;
            
                this._settingService.createUser(this.form.value).subscribe({
                    next: (res) => {
                        if (res) {
                            this._alert.open({ message: 'The user has been created.' });
                            this._matDialogRef.close();
                        }
                    },
                    error: e => {
                        console.log(e)
                        let message = JSON.stringify(e.message);
                        if (e.error) message = JSON.stringify(e.error);
                        const dialogRef = this._fuseConfirmationService.open({
                            icon: { color: 'warn' },
                            title: `Error`,
                            message: message,
                            actions: { confirm: { color: 'primary' }, cancel: { show: false } }
                        });
                    }
                });
        }

    }

    onDelete(): void {
        let dialogRef = this._fuseConfirmationService.open({
            message: `Are you sure to delete?`,
            icon: { color: 'warn' },
            actions: { confirm: { label: 'Delete', color: 'warn' } }

        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === 'confirmed') {
                this.delete();
                this._changeDetectorRef.markForCheck();
            }
        });

    }

    delete(): void {
        this._settingService.deleteUser(this.user.id).subscribe({
            next: (res) => {
                this._alert.open({ message: 'The user has been deleted.' });

                this._matDialogRef.close();
            },
            error: e => {
                console.log(e)
                let message = JSON.stringify(e.message);
                if (e.error) message = JSON.stringify(e.error);
                const dialogRef = this._fuseConfirmationService.open({
                    icon: { color: 'warn' },
                    title: `Error`,
                    message: message,
                    actions: { confirm: { color: 'primary' }, cancel: { show: false } }
                });
            }
        });
    }
}
