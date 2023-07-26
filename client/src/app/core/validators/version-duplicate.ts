import { Injectable } from "@angular/core";
import { FormControl } from "@angular/forms";

@Injectable({
    providedIn: 'root'
})
export class VersionDuplicate {
    validator(control: FormControl, id: number, versions: any[]): { [key: string]: boolean } {
                
        let duplicate = versions.findIndex(e => e.id != id && e.version === control.value);

        if (control.value && duplicate !== -1) {
            return { duplicate: true };
        }

        return null;
    }
}
