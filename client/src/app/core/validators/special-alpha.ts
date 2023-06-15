import { Injectable } from "@angular/core";
import { FormControl } from "@angular/forms";

@Injectable({
    providedIn: 'root'
})
export class SpecialAlpha {
    nameValidator(control: FormControl): { [key: string]: boolean } {

        const nameRegexp: RegExp = /[!^\[\];':"\\|,\/?]/;
        
        if (control.value && nameRegexp.test(control.value)) {
            return { invalidName: true };
        }
      
        return null;
    }
}
