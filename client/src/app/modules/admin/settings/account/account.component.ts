import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'settings-account',
    templateUrl: './account.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsAccountComponent implements OnInit {
    members: any[];
    roles: any[];

    /**
     * Constructor
     */
    constructor(

    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
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

        // Setup the roles
        this.roles = [           
            {
                label: 'User',
                value: 'user',
            },
            {
                label: 'Admin',
                value: 'admin',
            }
        ];
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}
