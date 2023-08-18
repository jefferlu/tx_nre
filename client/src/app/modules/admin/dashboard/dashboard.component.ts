import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { fuseAnimations } from '@fuse/animations';
import { ApexOptions } from 'ng-apexcharts';
import { DashboardService } from './dashboard.service';


@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    chartNreUpdates: ApexOptions;
    chartManHrs: ApexOptions;
    chartEquipHrs: ApexOptions;
    chartEquipFee: ApexOptions;
    chartEquipFeeYear: ApexOptions;
    data: any;

    constructor(private _dashboardService: DashboardService) { }

    ngOnInit(): void {

        // Get data
        this._dashboardService.data$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((res: any) => {
                if (res) {
                    this.data = res;
                    this.data = {
                        "nre_updates": {
                            "count": res.nre_updates.count,
                            "series": res.nre_updates.data.map(e => e.version_count),
                            "labels": res.nre_updates.data.map(e => e.name),
                        },
                        "man_hrs": {
                            "count": res.hrs.man.total,
                            "series": res.hrs.man.data.map(e => e.man_hrs),
                            "labels": res.hrs.man.data.map(e => e.name),
                        },
                        "equip_hrs": {
                            "count": res.hrs.equip.total,
                            "series": res.hrs.equip.data.map(e => e.equip_hrs),
                            "labels": res.hrs.equip.data.map(e => e.name),
                        },
                        "equip_fee": {
                            "count": res.hrs.fee.total,
                            "series": res.hrs.fee.data.map(e => e.fees),
                            "labels": res.hrs.fee.data.map(e => e.name),
                        },
                        "equip_fee_year": {
                            "series": [{
                                "name": "USD",
                                "type": "column",
                                "data": res.fee_years.map(e => e.total_fees)
                            }],
                            "labels": res.fee_years.map(e => e.year)
                        },
                    }

                    console.log(this.data)

                    this._prepareChartData();
                }
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    private _prepareChartData(): void {

        // Github issues
        this.chartEquipFeeYear = {
            chart: {
                fontFamily: 'inherit',
                foreColor: 'inherit',
                height: '100%',
                type: 'line',
                toolbar: {
                    show: false
                },
                zoom: {
                    enabled: false
                }
            },
            colors: ['#319795'],
            dataLabels: {
                enabled: false,
                enabledOnSeries: [0],
                background: {
                    borderWidth: 0
                }
            },
            grid: {
                borderColor: 'var(--fuse-border)'
            },
            labels: this.data.equip_fee_year.labels,
            legend: {
                show: false
            },
            plotOptions: {
                bar: {
                    columnWidth: '50%'
                }
            },
            series: this.data.equip_fee_year.series,
            states: {
                hover: {
                    filter: {
                        type: 'darken',
                        value: 0.75
                    }
                }
            },
            stroke: {
                width: [0]
            },
            tooltip: {
                // followCursor: true,
                theme: 'dark'
            },
            xaxis: {
                axisBorder: {
                    show: false
                },
                axisTicks: {
                    color: 'var(--fuse-border)'
                },
                labels: {
                    style: {
                        colors: 'var(--fuse-text-secondary)'
                    }
                },
                tooltip: {
                    enabled: false
                }
            },
            yaxis: {
                labels: {
                    offsetX: -16,
                    style: {
                        colors: 'var(--fuse-text-secondary)'
                    }
                }
            }
        };

        // NRE更新次數
        this.chartNreUpdates = {
            chart: {
                animations: {
                    speed: 400,
                    animateGradually: {
                        enabled: false
                    }
                },
                fontFamily: 'inherit',
                foreColor: 'inherit',
                height: '100%',
                type: 'donut',
                sparkline: {
                    enabled: true
                }
            },
            colors: this._getRandomColors(0, this.data.nre_updates.series.length),
            labels: this.data.nre_updates.labels,
            plotOptions: {
                pie: {
                    customScale: 0.9,
                    expandOnClick: false,
                    donut: {
                        size: '70%'
                    }
                }
            },
            series: this.data.nre_updates.series,
            states: {
                hover: {
                    filter: {
                        type: 'none'
                    }
                },
                active: {
                    filter: {
                        type: 'none'
                    }
                }
            },
            tooltip: {
                enabled: true,
                fillSeriesColor: false,
                theme: 'dark',
                custom: ({
                    seriesIndex,
                    w
                }): string => `<div class="flex items-center h-8 min-h-8 max-h-8 px-3">
                                                    <div class="w-3 h-3 rounded-full" style="background-color: ${w.config.colors[seriesIndex]};"></div>
                                                    <div class="ml-2 text-md leading-none">${w.config.labels[seriesIndex]}:</div>
                                                    <div class="ml-2 text-md font-bold leading-none">${(w.config.series[seriesIndex] / this.data.nre_updates.count * 100).toFixed(2)}%</div>
                                                </div>`
            }
        };

        // 人力工時
        this.chartManHrs = {
            chart: {
                animations: {
                    speed: 400,
                    animateGradually: {
                        enabled: false
                    }
                },
                fontFamily: 'inherit',
                foreColor: 'inherit',
                height: '100%',
                type: 'donut',
                sparkline: {
                    enabled: true
                }
            },
            colors: this._getRandomColors(0, this.data.man_hrs.series.length),
            labels: this.data.man_hrs.labels,
            plotOptions: {
                pie: {
                    customScale: 0.9,
                    expandOnClick: false,
                    donut: {
                        size: '70%'
                    }
                }
            },
            series: this.data.man_hrs.series,
            states: {
                hover: {
                    filter: {
                        type: 'none'
                    }
                },
                active: {
                    filter: {
                        type: 'none'
                    }
                }
            },
            tooltip: {
                enabled: true,
                fillSeriesColor: false,
                theme: 'dark',
                custom: ({
                    seriesIndex,
                    w
                }): string => `<div class="flex items-center h-8 min-h-8 max-h-8 px-3">
                                                    <div class="w-3 h-3 rounded-full" style="background-color: ${w.config.colors[seriesIndex]};"></div>
                                                    <div class="ml-2 text-md leading-none">${w.config.labels[seriesIndex]}:</div>
                                                    <div class="ml-2 text-md font-bold leading-none">${(w.config.series[seriesIndex] / this.data.man_hrs.count * 100).toFixed(2)}%</div>
                                                </div>`
            }
        };

        // 設備工時
        this.chartEquipHrs = {
            chart: {
                animations: {
                    speed: 400,
                    animateGradually: {
                        enabled: false
                    }
                },
                fontFamily: 'inherit',
                foreColor: 'inherit',
                height: '100%',
                type: 'donut',
                sparkline: {
                    enabled: true
                }
            },
            colors: this._getRandomColors(0, this.data.equip_hrs.series.length),
            labels: this.data.equip_hrs.labels,
            plotOptions: {
                pie: {
                    customScale: 0.9,
                    expandOnClick: false,
                    donut: {
                        size: '70%'
                    }
                }
            },
            series: this.data.equip_hrs.series,
            states: {
                hover: {
                    filter: {
                        type: 'none'
                    }
                },
                active: {
                    filter: {
                        type: 'none'
                    }
                }
            },
            tooltip: {
                enabled: true,
                fillSeriesColor: false,
                theme: 'dark',
                custom: ({
                    seriesIndex,
                    w
                }): string => `<div class="flex items-center h-8 min-h-8 max-h-8 px-3">
                                                    <div class="w-3 h-3 rounded-full" style="background-color: ${w.config.colors[seriesIndex]};"></div>
                                                    <div class="ml-2 text-md leading-none">${w.config.labels[seriesIndex]}:</div>
                                                    <div class="ml-2 text-md font-bold leading-none">${(w.config.series[seriesIndex] / this.data.equip_hrs.count * 100).toFixed(2)}%</div>
                                                </div>`
            }
        };

        // 設備費用
        this.chartEquipFee = {
            chart: {
                animations: {
                    speed: 400,
                    animateGradually: {
                        enabled: false
                    }
                },
                fontFamily: 'inherit',
                foreColor: 'inherit',
                height: '100%',
                type: 'donut',
                sparkline: {
                    enabled: true
                }
            },
            colors: this._getRandomColors(0, this.data.equip_fee.series.length),
            labels: this.data.equip_fee.labels,
            plotOptions: {
                pie: {
                    customScale: 0.9,
                    expandOnClick: false,
                    donut: {
                        size: '70%'
                    }
                }
            },
            series: this.data.equip_fee.series,
            states: {
                hover: {
                    filter: {
                        type: 'none'
                    }
                },
                active: {
                    filter: {
                        type: 'none'
                    }
                }
            },
            tooltip: {
                enabled: true,
                fillSeriesColor: false,
                theme: 'dark',
                custom: ({
                    seriesIndex,
                    w
                }): string => `<div class="flex items-center h-8 min-h-8 max-h-8 px-3">
                                                    <div class="w-3 h-3 rounded-full" style="background-color: ${w.config.colors[seriesIndex]};"></div>
                                                    <div class="ml-2 text-md leading-none">${w.config.labels[seriesIndex]}:</div>
                                                    <div class="ml-2 text-md font-bold leading-none">${(w.config.series[seriesIndex] / this.data.equip_fee.count * 100).toFixed(2)}%</div>
                                                </div>`
            }
        };
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

