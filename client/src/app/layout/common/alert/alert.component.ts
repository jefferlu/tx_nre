import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { FuseAlertModule } from '@fuse/components/alert';

@Component({
    selector: 'app-alert',
    templateUrl: './alert.component.html',
    styleUrls: ['./alert.component.scss'],
    standalone: true,
    imports: [FuseAlertModule]
})
export class AlertComponent {

    constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) {

    }

    ngOnInit(): void {
        // this.data.message='update completed'
        console.log('init',this.data)
    }
}
