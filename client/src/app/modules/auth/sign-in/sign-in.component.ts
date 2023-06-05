import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/core/auth/auth.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-sign-in',
    templateUrl: './sign-in.component.html',
    styleUrls: ['./sign-in.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class SignInComponent implements OnInit {

    env = environment;
    signInForm: UntypedFormGroup;

    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _formBuilder: UntypedFormBuilder,
        // private _authService: AuthService,
    ) { }

    ngOnInit(): void {
        this.signInForm = this._formBuilder.group({
            email: ['admin@company.com', [Validators.required, Validators.email]],
            password: ['815035', Validators.required],
            rememberMe: ['']
        });
    }

    signIn(): void {
        console.log('signIn')
    }
}
