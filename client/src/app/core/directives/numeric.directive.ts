import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
    selector: 'input[numeric-only]'
})
export class NumericOnlyDirective {

    // Allow decimal numbers and negative values
    private regex: RegExp = new RegExp(/^\d*?\d{0}$/g);
    // Allow key codes for special events. Reflect :
    // Backspace, tab, end, home
    private specialKeys: Array<string> = ['Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Del', 'Delete'];

    constructor(private el: ElementRef, private control: NgControl) { }

    @HostListener('input', ['$event.target'])
    onEvent(target: HTMLInputElement) {
        this.control.viewToModelUpdate((target.value === '') ? null : target.value);
    }

    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        // console.log(this.el.nativeElement.value);
        // Allow Backspace, tab, end, and home keys
        if (this.specialKeys.indexOf(event.key) !== -1) {
            return;
        }
        let current: string = this.el.nativeElement.value;
        const position = this.el.nativeElement.selectionStart;
        const next: string = [current.slice(0, position), event.key == 'Decimal' ? '.' : event.key, current.slice(position)].join('');
        if (next && !String(next).match(this.regex)) {
            event.preventDefault();
        }
    }
}

@Directive({
    selector: 'input[numeric-two-digit]'
})
export class NumericTwoDigitDirective {

    private regex: RegExp = new RegExp(/^\d*\.?\d{0,2}$/g);
    private specialKeys: Array<string> = ['Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Del', 'Delete'];

    constructor(private el: ElementRef, private control: NgControl) { }

    @HostListener('input', ['$event.target'])
    onEvent(target: HTMLInputElement) {
        this.control.viewToModelUpdate((target.value === '') ? null : target.value);
    }

    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {

        if (this.specialKeys.indexOf(event.key) !== -1) {
            return;
        }
        let current: string = this.el.nativeElement.value;
        const position = this.el.nativeElement.selectionStart;
        const next: string = [current.slice(0, position), event.key == 'Decimal' ? '.' : event.key, current.slice(position)].join('');
        if (next && !String(next).match(this.regex)) {
            event.preventDefault();
        }
    }
}


