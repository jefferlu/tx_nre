import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import * as ExcelJS from 'exceljs';
import * as fs from 'file-saver';

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

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                }
            });
    }

    onSearch(value: string): void {
        this._settingsService.queryItems({ query: value })
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {
                if (res) {
                    this.page.data = JSON.parse(JSON.stringify(res));

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                }
            });
    }

    onImport(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls'
        input.click();

        input.addEventListener('change', (event: any) => {
            const file = event.target.files[0];

            if (file && file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                this.readExcel(file);
            }
            else {
                this._alert.open({ type: 'warn', message: 'Please select a valid Excel file.' });
            }
        });
    }

    async readExcel(file: any) {
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(file);

            // 取得第工作表
            const worksheet = workbook.worksheets[0];

            // 讀取資料
            let jsonData: any[] = [];
            worksheet.eachRow((row, rowNumber) => {
                const rowData = [];

                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    let cellValue = cell.value;

                    // 檢查cell是否含有複雜格式
                    if (cellValue && cellValue['richText'])
                        cellValue = cell.text;

                    // 去掉字串開頭和結尾的空白及換行符號
                    if (typeof (cellValue) === 'string')
                        cellValue = cellValue.replace(/\r\n$/, '').trim();

                    rowData.push(cellValue);
                });

                jsonData.push(rowData);
            });

            // 移除所有欄位都是空白的column
            const isColumnAllNull = colIndex => jsonData.every(row => row[colIndex] === null);
            jsonData = jsonData.map(row => row.filter((cell, colIndex) => !isColumnAllNull(colIndex)));

            // 檢查Excel格式
            if (jsonData.length === 0) {
                this._alert.open({ type: 'warn', message: 'The Excel has no data.' });
                return;
            }

            if (jsonData[0][1] !== 'Enterprise Reliability Test Procedures') {
                this._alert.open({ type: 'warn', duration: 5, message: 'The format of the Excel data is wrong, please confirm whether the correct template is used.' });
                return;
            }

            this.page.data = [];
            for (let rowIndex = 0; rowIndex < jsonData.length; rowIndex++) {
                const row = jsonData[rowIndex];
                if (rowIndex > 1) {
                    this.page.data.push({
                        'no': row[1].split(' ')[0],
                        'name': row[1],
                        'man_working_hours': parseFloat(row[2]).toFixed(2),
                        'equip_working_hours': parseFloat(row[3]).toFixed(2),
                        'order': rowIndex
                    })
                }
            };

            // 檢查重複的no，並保留索引較大的項目
            let existingItems = [];
            this.page.data = this.page.data.reduceRight((accumulator, current) => {
                const existingItem = accumulator.find(item => item.no === current.no);
                if (!existingItem) {
                    accumulator.unshift(current);

                }
                else {
                    // 記錄重複資訊
                    let duplicated = existingItems.find(e => e.no === existingItem.no)
                    if (duplicated) {
                        duplicated.count++;
                    }
                    else {
                        existingItems.push({ no: existingItem.no, count: 1 });
                    }

                }
                return accumulator;
            }, []);

            // 顯示重複資訊並執行
            if (existingItems.length > 0) {
                let message = '';
                for (let item of existingItems) {
                    message += `${item.no}&emsp; 重複: ${item.count}<br/>`
                }
                const dialogRef = this._fuseConfirmationService.open({
                    title: 'Info',
                    message: message,
                    icon: { color: 'info' },
                    actions: { confirm: { color: 'primary', label: 'Continue' }, cancel: { show: false } }
                });
                dialogRef.afterClosed().subscribe(result => {
                    if (result === 'confirmed') {
                        this.save(this.page.data);
                    }
                });
            }
            else { this.save(this.page.data); }
        }
        catch (e) {
            this._alert.open({ type: 'warn', duration: 5, message: 'The format of the Excel data is wrong, please confirm whether the correct template is used.' });
        }
    }

    onChange(): void {
        // this.page.status = {
        //     label: 'Modified',
        //     color: 'red',
        //     change: true
        // }
    }

    onDownload(): void {
        const filename = 'nre_test_item_template.xlsx'; // 下載的檔案名稱
        const filePath = 'assets/excel/' + filename; // 要下載的檔案路徑

        fetch(filePath)
            .then(response => response.blob())
            .then(blob => {
                fs.saveAs(blob, filename);
            });
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

        this.save(this.page.data);
    }

    private save(data: any) {

        this._settingsService.saveItems(data)
            .subscribe({
                next: (res) => {
                    this.page.data = res;

                    // 更新services，避免OnInit還原舊資料
                    this._settingsService.items = res;

                    this._alert.open({ message: 'Upload completed.' });
                    this._changeDetectorRef.markForCheck();
                },
                error: e => {
                    console.log(e)
                    const dialogRef = this._fuseConfirmationService.open({
                        title: 'Error',
                        message: JSON.stringify(e.message),
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
