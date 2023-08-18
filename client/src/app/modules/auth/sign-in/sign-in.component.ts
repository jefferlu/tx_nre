import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { environment } from 'environments/environment';

@Component({
    selector: 'app-sign-in',
    templateUrl: './sign-in.component.html',
    styleUrls: ['./sign-in.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class SignInComponent implements OnInit {

    env = environment;
    signInForm: UntypedFormGroup;

    showAlert: boolean = false;
    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '123'
    };

    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _formBuilder: UntypedFormBuilder,
        private _authService: AuthService,
    ) { }

    ngOnInit(): void {
        this.signInForm = this._formBuilder.group({
            email: ['demo@example.com', [Validators.required, Validators.email]],
            password: ['demo', Validators.required],
            rememberMe: ['']
        });
    }

    signIn(): void {
        if (this.signInForm.invalid) return;

        this.signInForm.disable();
        this.showAlert = false;

        this._authService.signIn(this.signInForm.value).subscribe({
            next: (res) => {
                const redirectURL = this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect';

                // Navigate to the redirect url
                this._router.navigateByUrl(redirectURL);
            },
            error: (e) => {
                // Re-enable the form
                this.signInForm.enable();

                // Reset the form
                //  this.signInNgForm.resetForm();

                // Set the alert
                this.alert = {
                    type: 'error',
                    message: e.status === 401 ? 'Wrong email or password。' : `${e.message}` //auth.interceptor catchError()
                };

                if (e.status === 401) {
                    this.alert.message = 'Wrong email or password。'
                }
                else if (e.error && e.error.detail) {
                    this.alert.message = e.error.detail
                }
                else {
                    this.alert.message = e.message
                }

                // Show the alert
                this.showAlert = true;

            }
        })

    }
}
