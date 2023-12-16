import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewEncapsulation, ViewChildren, QueryList } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { fuseAnimations } from '@fuse/animations';

import { ApexOptions } from 'ng-apexcharts';
import { Workbook, Worksheet } from 'exceljs';
import * as fs from 'file-saver';
import * as dayjs from 'dayjs';
import * as ApexCharts from 'apexcharts';

import { DashboardService } from './dashboard.service';
import { AlertService } from 'app/layout/common/alert/alert.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';


@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {

    @ViewChildren("chartElement") chartElements: QueryList<any>;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    drawerOpened: boolean = true;
    displayed: boolean = false;

    chartNreUpdates: ApexOptions;
    chartManHrs: ApexOptions;
    chartEquipHrs: ApexOptions;
    chartEquipFee: ApexOptions;
    chartEquipFeeYear: ApexOptions;
    data: any = {
        "nre_updates": { "series": [], "labels": [], },
        "man_hrs": { "series": [], "labels": [], },
        "equip_hrs": { "series": [], "labels": [], },
        "equip_fee": { "series": [], "labels": [], },
        "equip_fee_year": { "series": [], "labels": [], }
    };

    page: any = {
        dataset: {
            projects: [],
            data: null
        }
    }

    chartOptions: ApexOptions;

    searchText: string = '';

    constructor(
        private _fuseConfirmationService: FuseConfirmationService,
        private _dashboardService: DashboardService,
        private _alert: AlertService

    ) { }

    ngOnInit(): void {

        // Get customers
        this._dashboardService.projects$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {
                if (res && res.length > 0) {

                    this.page.dataset.projects = res.map(e => { return { checked: false, name: e.name } })

                    // distinct
                    // this.page.dataset.projects = [...new Set(res.map(item => item.name))].map(e => { return { checked: false, name: e } });

                }
            });

        // Get data
        this._dashboardService.data$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {

                if (res) {
                    this.page.dataset.data = res;
                    this._prepareChartData();
                }                
            });
    }

    change(): void {
        this.manageData();

        this.displayed = false;
        this.page.dataset.projects.forEach(e => {
            if (e.checked) this.displayed = true;
        });
    }

    checkAll(event): void {
        this.page.dataset.projects.forEach(e => {
            e.checked = event.target.checked;
        });

        this.displayed = event.target.checked;
        this.manageData();

    }

    manageData(): void {
        let res = this.page.dataset.data;

        let selected = this.page.dataset.projects.filter(e => e.checked === true).map(e => e.name);

        // 更新次數
        this.data.nre_updates.series = res.nre_updates.data.filter(e => selected.includes(e.name)).map(e => e.version_count)
        this.data.nre_updates.labels = res.nre_updates.data.filter(e => selected.includes(e.name)).map(e => e.name)

        // 人力工時
        this.data.man_hrs.series = res.hrs.man.data.filter(e => selected.includes(e.name)).map(e => e.man_hrs);
        this.data.man_hrs.labels = res.hrs.man.data.filter(e => selected.includes(e.name)).map(e => e.name);

        // 設備費用
        this.data.equip_fee.series = res.hrs.fee.data.filter(e => selected.includes(e.name)).map(e => e.fees)
        this.data.equip_fee.labels = res.hrs.fee.data.filter(e => selected.includes(e.name)).map(e => e.name);

        // // 設備工時
        // this.data.equip_hrs.series = res.hrs.equip.data.map(e => e.equip_hrs),
        // this.data.equip_hrs.labels = res.hrs.equip.data.map(e => e.name),

        // // 年度
        // this.data.equip_fee_year.series = [{
        //     "name": "USD",
        //     "type": "column",
        //     "data": res.fee_years.map(e => e.total_fees)
        // }]
        // this.data.equip_fee_year.labels = res.fee_years.map(e => e.year)

        this._prepareChartData();
    }

    onExport(): void {
        if (!this.displayed) {
            // this._alert.open({ type: 'warn', duration: 5, message: 'The chart has not been saved.' });
            return;
        }

        let dialogRef = this._fuseConfirmationService.open({
            message: `Are you sure to export?`,
            icon: { color: 'primary' },
            actions: { confirm: { label: 'Export', color: 'primary' } }

        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === 'confirmed') {
                this.export();
                this._alert.open({ type: 'info', duration: 5, message: 'Export completed.' });
            }
        });

    }

    async export() {

        let chartElements = [];
        this.chartElements.forEach((e, index) => {
            let chartElement = e.chartElement.nativeElement;
            chartElements.push(chartElement);
        });

        /* Write to Excel */
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet();
        let imgId;

        // nre update
        const chart_nre_update: any = ApexCharts.getChartByID('nre_update');
        const img_nre_update = (await chart_nre_update.dataURI()).imgURI;

        imgId = workbook.addImage({ base64: img_nre_update, extension: "png" });
        worksheet.addImage(imgId, { tl: { col: 1, row: 1 }, ext: { width: 689, height: 365 }, });

        // nre update
        const chart_man_hrs: any = ApexCharts.getChartByID('man_hrs');
        const img_man_hrs = (await chart_man_hrs.dataURI()).imgURI;

        imgId = workbook.addImage({ base64: img_man_hrs, extension: "png" });
        worksheet.addImage(imgId, { tl: { col: 14, row: 1 }, ext: { width: 689, height: 365 }, });


        // nre update
        const chart_equip_hrs: any = ApexCharts.getChartByID('equip_hrs');
        const img_equip_hrs = (await chart_equip_hrs.dataURI()).imgURI;

        imgId = workbook.addImage({ base64: img_equip_hrs, extension: "png" });
        worksheet.addImage(imgId, { tl: { col: 1, row: 20 }, ext: { width: 689, height: 365 }, });

        // Save to File
        workbook.xlsx.writeBuffer().then((buffer) => {
            let blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            let datetime: any = dayjs().format('YYYYMMDDHHmmss');
            fs.saveAs(blob, `Chart_${datetime}.xlsx`);
        });
    }


    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    private _prepareChartData(): void {

        // NRE更新次數
        this.chartNreUpdates = {
            title: {
                text: 'NRE update Times',
                align: 'left',
                floating: true,
                style: {
                    fontSize: '20px',
                    fontWeight: 'bold'
                },
            },
            series: [
                {
                    name: "次數",
                    data: this.data.nre_updates.series
                }
            ],
            chart: {
                id: 'nre_update',
                type: "bar",
                height: 400,
                toolbar: {
                    show: false
                },
                animations: { enabled: false }
            },
            colors: ['#3182CE'],
            plotOptions: {
                bar: {
                    horizontal: true
                }
            },
            dataLabels: {
                enabled: false
            },
            xaxis: {
                categories: this.data.nre_updates.labels
            },
            tooltip: {
                followCursor: true,
                theme: 'dark'
            },
        };

        // 人力工時
        this.chartManHrs = {
            title: {
                text: 'Staff Hour',
                align: 'left',
                floating: true,
                offsetY: -6,
                style: {
                    fontSize: '20px',
                    fontWeight: 'bold'
                },
            },
            series: [
                {
                    name: "Hour",
                    data: this.data.man_hrs.series
                }
            ],
            chart: {
                id: 'man_hrs',
                type: "bar",
                height: 400,
                toolbar: {
                    show: false
                },
                animations: { enabled: false }
            },
            colors: ['#319795'],
            plotOptions: {
                bar: {
                    horizontal: true
                }
            },
            dataLabels: {
                enabled: false
            },
            xaxis: {
                categories: this.data.man_hrs.labels
            },
            tooltip: {
                followCursor: true,
                theme: 'dark'
            },
        };

        // 設備費用
        this.chartEquipFee = {
            title: {
                text: 'Test Fee',
                align: 'left',
                floating: true,
                style: {
                    fontSize: '20px',
                    fontWeight: 'bold'
                },
            },
            series: [
                {
                    name: "Hour",
                    data: this.data.equip_fee.series
                }
            ],
            chart: {
                id: 'equip_hrs',
                type: "bar",
                height: 400,
                toolbar: {
                    show: false
                },
                animations: { enabled: false }
            },
            colors: ['#805AD5'],
            plotOptions: {
                bar: {
                    horizontal: true
                }
            },
            dataLabels: {
                enabled: false
            },
            xaxis: {
                categories: this.data.equip_fee.labels
            },
            tooltip: {
                followCursor: true,
                theme: 'dark'
            },
        };


        // // Github issues
        // this.chartEquipFeeYear = {
        //     chart: {
        //         fontFamily: 'inherit',
        //         foreColor: 'inherit',
        //         height: '100%',
        //         type: 'bar',
        //         toolbar: {
        //             show: false
        //         },
        //         zoom: {
        //             enabled: false
        //         }
        //     },
        //     colors: ['#319795'],
        //     dataLabels: {
        //         enabled: false,
        //         enabledOnSeries: [0],
        //         background: {
        //             borderWidth: 0
        //         }
        //     },
        //     grid: {
        //         borderColor: 'var(--fuse-border)'
        //     },
        //     labels: this.data.equip_fee_year.labels,
        //     legend: {
        //         show: false
        //     },
        //     plotOptions: {
        //         bar: {
        //             columnWidth: '50%'
        //         }
        //     },
        //     series: this.data.equip_fee_year.series,
        //     states: {
        //         hover: {
        //             filter: {
        //                 type: 'darken',
        //                 value: 0.75
        //             }
        //         }
        //     },
        //     stroke: {
        //         width: [0]
        //     },
        //     tooltip: {
        //         // followCursor: true,
        //         theme: 'dark'
        //     },
        //     xaxis: {
        //         axisBorder: {
        //             show: false
        //         },
        //         axisTicks: {
        //             color: 'var(--fuse-border)'
        //         },
        //         labels: {
        //             style: {
        //                 colors: 'var(--fuse-text-secondary)'
        //             }
        //         },
        //         tooltip: {
        //             enabled: false
        //         }
        //     },
        //     yaxis: {
        //         labels: {
        //             offsetX: -16,
        //             style: {
        //                 colors: 'var(--fuse-text-secondary)'
        //             }
        //         }
        //     }
        // };

        // NRE更新次數
        // this.chartNreUpdates = {
        //     chart: {
        //         animations: {
        //             speed: 400,
        //             animateGradually: {
        //                 enabled: false
        //             }
        //         },
        //         fontFamily: 'inherit',
        //         foreColor: 'inherit',
        //         height: '100%',
        //         type: 'donut',
        //         sparkline: {
        //             enabled: true
        //         }
        //     },
        //     colors: this._getRandomColors(0, this.data.nre_updates.series.length),
        //     labels: this.data.nre_updates.labels,
        //     plotOptions: {
        //         pie: {
        //             customScale: 0.9,
        //             expandOnClick: false,
        //             donut: {
        //                 size: '70%'
        //             }
        //         }
        //     },
        //     series: this.data.nre_updates.series,
        //     states: {
        //         hover: {
        //             filter: {
        //                 type: 'none'
        //             }
        //         },
        //         active: {
        //             filter: {
        //                 type: 'none'
        //             }
        //         }
        //     },
        //     tooltip: {
        //         enabled: true,
        //         fillSeriesColor: false,
        //         theme: 'dark',
        //         custom: ({
        //             seriesIndex,
        //             w
        //         }): string => `<div class="flex items-center h-8 min-h-8 max-h-8 px-3">
        //                                             <div class="w-3 h-3 rounded-full" style="background-color: ${w.config.colors[seriesIndex]};"></div>
        //                                             <div class="ml-2 text-md leading-none">${w.config.labels[seriesIndex]}:</div>
        //                                             <div class="ml-2 text-md font-bold leading-none">${(w.config.series[seriesIndex] / this.data.nre_updates.count * 100).toFixed(2)}%</div>
        //                                         </div>`
        //     }
        // };

        // 人力工時
        // this.chartManHrs = {
        //     chart: {
        //         animations: {
        //             speed: 400,
        //             animateGradually: {
        //                 enabled: false
        //             }
        //         },
        //         fontFamily: 'inherit',
        //         foreColor: 'inherit',
        //         height: '100%',
        //         type: 'donut',
        //         sparkline: {
        //             enabled: true
        //         }
        //     },
        //     colors: this._getRandomColors(0, this.data.man_hrs.series.length),
        //     labels: this.data.man_hrs.labels,
        //     plotOptions: {
        //         pie: {
        //             customScale: 0.9,
        //             expandOnClick: false,
        //             donut: {
        //                 size: '70%'
        //             }
        //         }
        //     },
        //     series: this.data.man_hrs.series,
        //     states: {
        //         hover: {
        //             filter: {
        //                 type: 'none'
        //             }
        //         },
        //         active: {
        //             filter: {
        //                 type: 'none'
        //             }
        //         }
        //     },
        //     tooltip: {
        //         enabled: true,
        //         fillSeriesColor: false,
        //         theme: 'dark',
        //         custom: ({
        //             seriesIndex,
        //             w
        //         }): string => `<div class="flex items-center h-8 min-h-8 max-h-8 px-3">
        //                                             <div class="w-3 h-3 rounded-full" style="background-color: ${w.config.colors[seriesIndex]};"></div>
        //                                             <div class="ml-2 text-md leading-none">${w.config.labels[seriesIndex]}:</div>
        //                                             <div class="ml-2 text-md font-bold leading-none">${(w.config.series[seriesIndex] / this.data.man_hrs.count * 100).toFixed(2)}%</div>
        //                                         </div>`
        //     }
        // };

        // 設備工時
        // this.chartEquipHrs = {
        //     chart: {
        //         animations: {
        //             speed: 400,
        //             animateGradually: {
        //                 enabled: false
        //             }
        //         },
        //         fontFamily: 'inherit',
        //         foreColor: 'inherit',
        //         height: '100%',
        //         type: 'donut',
        //         sparkline: {
        //             enabled: true
        //         }
        //     },
        //     colors: this._getRandomColors(0, this.data.equip_hrs.series.length),
        //     labels: this.data.equip_hrs.labels,
        //     plotOptions: {
        //         pie: {
        //             customScale: 0.9,
        //             expandOnClick: false,
        //             donut: {
        //                 size: '70%'
        //             }
        //         }
        //     },
        //     series: this.data.equip_hrs.series,
        //     states: {
        //         hover: {
        //             filter: {
        //                 type: 'none'
        //             }
        //         },
        //         active: {
        //             filter: {
        //                 type: 'none'
        //             }
        //         }
        //     },
        //     tooltip: {
        //         enabled: true,
        //         fillSeriesColor: false,
        //         theme: 'dark',
        //         custom: ({
        //             seriesIndex,
        //             w
        //         }): string => `<div class="flex items-center h-8 min-h-8 max-h-8 px-3">
        //                                             <div class="w-3 h-3 rounded-full" style="background-color: ${w.config.colors[seriesIndex]};"></div>
        //                                             <div class="ml-2 text-md leading-none">${w.config.labels[seriesIndex]}:</div>
        //                                             <div class="ml-2 text-md font-bold leading-none">${(w.config.series[seriesIndex] / this.data.equip_hrs.count * 100).toFixed(2)}%</div>
        //                                         </div>`
        //     }
        // };

        // // 設備費用
        // this.chartEquipFee = {
        //     chart: {
        //         animations: {
        //             speed: 400,
        //             animateGradually: {
        //                 enabled: false
        //             }
        //         },
        //         fontFamily: 'inherit',
        //         foreColor: 'inherit',
        //         height: '100%',
        //         type: 'donut',
        //         sparkline: {
        //             enabled: true
        //         }
        //     },
        //     colors: this._getRandomColors(0, this.data.equip_fee.series.length),
        //     labels: this.data.equip_fee.labels,
        //     plotOptions: {
        //         pie: {
        //             customScale: 0.9,
        //             expandOnClick: false,
        //             donut: {
        //                 size: '70%'
        //             }
        //         }
        //     },
        //     series: this.data.equip_fee.series,
        //     states: {
        //         hover: {
        //             filter: {
        //                 type: 'none'
        //             }
        //         },
        //         active: {
        //             filter: {
        //                 type: 'none'
        //             }
        //         }
        //     },
        //     tooltip: {
        //         enabled: true,
        //         fillSeriesColor: false,
        //         theme: 'dark',
        //         custom: ({
        //             seriesIndex,
        //             w
        //         }): string => `<div class="flex items-center h-8 min-h-8 max-h-8 px-3">
        //                                             <div class="w-3 h-3 rounded-full" style="background-color: ${w.config.colors[seriesIndex]};"></div>
        //                                             <div class="ml-2 text-md leading-none">${w.config.labels[seriesIndex]}:</div>
        //                                             <div class="ml-2 text-md font-bold leading-none">${(w.config.series[seriesIndex] / this.data.equip_fee.count * 100).toFixed(2)}%</div>
        //                                         </div>`
        //     }
        // };
    }

    private _getRandomColors(hue: number, count: number): string[] {
        const colors = ['#3182CE', '#63B3ED', '#319795', '#4FD1C5', '#DD6B20', '#F6AD55', '#805AD5', '#B794F4'];
        const hueStep = 20;
        const saturation = 75; // 設定飽和度，可以根據需求調整

        for (let i = 0; i < count; i++) {
            const customColor = `hsl(${hue}, ${saturation}%, 50%)`;
            colors.push(customColor);
            hue = (hue + hueStep) % 360;
        }

        return colors;
    }

}



