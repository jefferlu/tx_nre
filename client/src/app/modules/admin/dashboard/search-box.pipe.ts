import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'searchBox'
})
export class SearchBoxPipe implements PipeTransform {

    transform(data: Array<any>, name: string): Array<any> {
        return data.filter((e, idx) => {
            if (e.name.toUpperCase().indexOf(name.toUpperCase()) > -1) {
                return data[idx];
            }
        });
    }

}
