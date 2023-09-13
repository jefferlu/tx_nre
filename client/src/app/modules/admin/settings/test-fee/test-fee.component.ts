import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import * as ExcelJS from 'exceljs';
import * as fs from 'file-saver';

import { AlertService } from 'app/layout/common/alert/alert.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { SettingsService } from '../settings.service';


@Component({
    selector: 'test-fee',
    templateUrl: './test-fee.component.html',
    styleUrls: ['./test-fee.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TestFeeComponent implements OnInit {

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    currentYear = new Date().getFullYear();

    page = {
        customers: null,
        customer: null,
        data: null
    }

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _alert: AlertService,
        private _settingService: SettingsService
    ) {
    }

    ngOnInit(): void {

        // Get the customers
        this._settingService.customers$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {
                if (res && res.length > 0) {
                    this.page.customers = res;
                    // this.form.get('customer').setValue(res[0].id)
                    this.page.customer = res[0].id

                    this.page.data = JSON.parse(JSON.stringify(res[0]));

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                }
            });
    }

    onSelectionChange(value): void {
        this.page.data = JSON.parse(JSON.stringify(this.page.customers.find((e: any) => e.id === value)));
    }

    change(): void {

    }

    onImport(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls'
        input.click();

        input.addEventListener('change', (event: any) => {
            const file = event.target.files[0];

            if (file && file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                this.readExcel(file)
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

            if (jsonData.length === 0) {
                this._alert.open({ type: 'warn', message: 'The Excel has no data.' });
                return;
            }

            if (jsonData[0][0] === 'Reliability/S&V Test') {
                this._alert.open({ type: 'warn', message: 'Cannot find customer.' });
                return;
            }

            if (jsonData[1][0] !== "Reliability/S&V Test") {
                this._alert.open({ type: 'warn', duration: 5, message: 'The format of the Excel data is wrong, please confirm whether the correct template is used.' });
                return;
            }

            this.page.data = {
                'name': jsonData[0][0],
                'functions': []
            }
            for (let rowIndex = 3; rowIndex < jsonData.length; rowIndex++) {
                const row = jsonData[rowIndex];

                // 檢查function是否存在
                let funcItem = this.page.data.functions.find(item => item.name === row[0])

                if (!funcItem) {
                    this.page.data.functions.push({
                        'name': row[0],
                        'test_items': [{
                            'item_name': row[1],
                            'lab_location': row[2] ? row[2].toUpperCase() : null,
                            'chamber': row[3] ? row[3].toUpperCase() : '2K',
                            'fee': row[4] ?? 0,
                            'order': rowIndex
                        }]
                    })
                }
                else {
                    funcItem.test_items.push({
                        'item_name': row[1],
                        'lab_location': row[2] ? row[2].toUpperCase() : null,
                        'chamber': row[3] ? row[3].toUpperCase() : '2K',
                        'fee': row[4] ?? 0,
                        'order': rowIndex
                    })
                }
            }

            this.save(this.page.data);

        }
        catch (e) {
            this._alert.open({ type: 'warn', duration: 5, message: 'The format of the Excel data is wrong, please confirm whether the correct template is used.' });
        }
    }

    onSave(): void {
        this.save(this.page.data);
    }

    private save(data: any) {
        this._settingService.saveCustomers(data)
            .subscribe({
                next: (res) => {

                    // reset customer dropdown
                    let selectedItem = null;
                    if (this.page.customers)
                        selectedItem = this.page.customers.find(e => e.name == res.name && e.id == res.id);
                    else
                        this.page.customers = [];

                    if (selectedItem) {
                        // 將res assign給selectedItem, 不破壞原selectedItem變數指標
                        Object.assign(selectedItem, res);
                    }
                    else {
                        this.page.customers.push(res);
                        selectedItem = this.page.customers[this.page.customers.length - 1]
                    }

                    // 更新services，避免OnInit還原舊資料
                    this._settingService.customers = this.page.customers;

                    this.page.customer = selectedItem.id;
                    this.page.data = res;
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


    onDownload(): void {
        const filename = 'nre_3rd_fee_template.xlsx'; // 下載的檔案名稱
        const filePath = 'assets/excel/' + filename; // 要下載的檔案路徑

        fetch(filePath)
            .then(response => response.blob())
            .then(blob => {
                fs.saveAs(blob, filename);
            });
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
