import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { FuseValidators } from '@fuse/validators';
import { AuthService } from 'app/core/auth/auth.service';
import { AlertService } from 'app/layout/common/alert/alert.service';


@Component({
    selector: 'app-reset-password',
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class ResetPasswordComponent implements OnInit {

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: ''
    };
    resetPasswordForm: UntypedFormGroup;
    showAlert: boolean = false;

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _authService: AuthService,
        private _alert: AlertService
    ) { }

    ngOnInit(): void {
        // Create the form
        this.resetPasswordForm = this._formBuilder.group({
            username: [''],
            password: ['', Validators.required],
            passwordConfirm: ['', Validators.required]
        },
            {
                validators: FuseValidators.mustMatch('password', 'passwordConfirm')
            }
        );
    }

    resetPassword(): void {
        if (this.resetPasswordForm.invalid) return;

        this._authService.resetPassword(this.resetPasswordForm.value.passwordConfirm).subscribe({
            next: (res) => {
                this._alert.open({ message: 'The password has been change.' });
            },
            error: (e) => { }
        });
    }
}
