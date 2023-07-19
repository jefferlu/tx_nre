import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import * as XLSX from 'xlsx';

import { SettingsService } from '../settings.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { AlertService } from 'app/layout/common/alert/alert.service';

@Component({
    selector: 'default-items',
    templateUrl: './default-items.component.html',
    styleUrls: ['./default-items.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefaultItemsComponent implements OnInit {

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    elementPattern = null;
    page = {
        items: null,
        data: null
    }

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _settingsService: SettingsService,
        private _alert: AlertService
    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Get the items
        this._settingsService.items$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {
                if (res) {
                    this.page.items = res;

                    this.elementPattern = res[0];
                    this.page.data = JSON.parse(JSON.stringify(res));
                    // console.log('init', res)

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                }
            });
    }

    onSearch(value): void {
        console.log(value)
        this._settingsService.queryItems({ query: value })
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {
                if (res) {
                    console.log(res)
                    this.page.data = JSON.parse(JSON.stringify(res));

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                }
            });
    }

    onUpload(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls'
        input.click();

        input.addEventListener('change', (event: any) => {
            const file = event.target.files[0];
            if (file) {
                const fileReader: FileReader = new FileReader();
                fileReader.readAsArrayBuffer(file);

                // onload event
                fileReader.onload = (e: any) => {
                    const fileContent: string | ArrayBuffer = e.target.result;
                    const workbook: XLSX.WorkBook = XLSX.read(fileContent, { type: 'array' });
                    const worksheet: XLSX.WorkSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    console.log(jsonData)

                    if (!jsonData || jsonData.length === 0) {
                        this._alert.open({ type: 'warn', message: 'The Excel has no data.' });
                        return;
                    }

                    if (!jsonData[1] || !jsonData[1][1] || jsonData[1][1] !== "Enterprise Reliability Test Procedures") {
                        this._alert.open({ type: 'warn', duration: 5, message: 'The format of the Excel data is wrong, please confirm whether the correct template is used.' });
                        return;
                    }

                    let processedData: any[] = [];
                    for (let rowIndex = 0; rowIndex < jsonData.length; rowIndex++) {
                        const row = jsonData[rowIndex];

                        if (rowIndex > 2) {
                            let processedRow = {
                                'no': row[1].split(' ')[0],
                                'name': row[1],
                                'man_working_hours': parseFloat(row[2]).toFixed(2),
                                'equip_working_hours': parseFloat(row[3]).toFixed(2),
                            }

                            processedData.push(processedRow)
                        }
                    };

                    // console.log(processedData)

                    // 檢查重複的no，並保留索引較大的項目
                    const uniqueData = processedData.reduceRight((accumulator, current) => {
                        const existingItem = accumulator.find(item => item.no === current.no);
                        if (!existingItem) {
                            accumulator.unshift(current);
                        }
                        return accumulator;
                    }, []);

                    // console.log(uniqueData);

                    this._settingsService.saveItems(uniqueData)
                        .subscribe({
                            next: (res) => {
                                this.page.data = res;
                                this._alert.open({ message: 'Upload completed.' });
                                this._changeDetectorRef.markForCheck();
                            },
                            error: e => {
                                console.log(e)
                                const dialogRef = this._fuseConfirmationService.open({
                                    title: 'Error',
                                    message: JSON.stringify(e.error),
                                    actions: { confirm: { color: 'warn', label: 'OK' }, cancel: { show: false } }
                                });
                            }
                        });
                };
            }
        });

        
    }

    onChange(): void {
        // this.page.status = {
        //     label: 'Modified',
        //     color: 'red',
        //     change: true
        // }
    }

    onAdd(): void {
        let newItem = {}
        for (let key in this.elementPattern) {
            if (key !== 'id')
                newItem[key] = null;
        }
        this.page.data.unshift(newItem);
    }

    onSave(): void {

        console.log(this.page.data)
        this._settingsService.saveItems(this.page.data)
            .subscribe({
                next: (res) => {
                    this._alert.open({ message: 'Data has been saved.' });
                    this._changeDetectorRef.markForCheck();
                },
                error: e => {
                    console.log(e)
                    const dialogRef = this._fuseConfirmationService.open({
                        title: 'Error',
                        message: JSON.stringify(e.error),
                        actions: { confirm: { color: 'warn', label: 'OK' }, cancel: { show: false } }
                    });
                }
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
