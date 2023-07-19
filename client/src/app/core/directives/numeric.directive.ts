import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
    selector: 'input[numeric-only]'
})
export class NumericOnlyDirective {

    constructor(private el: ElementRef, private control: NgControl) { }

    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        const inputElement = this.el.nativeElement as HTMLInputElement;
        const currentValue = inputElement.value;
        const key = event.key;

        // 取得不需要阻止的非數字按鍵列表
        const allowedKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Backspace', 'Delete', 'Tab'];

        // 檢查輸入值是否符合小數2位的條件
        const decimalRegex = /^\d*?\d{0,0}$/;
        const nextValue = currentValue.slice(0, inputElement.selectionStart) + key + currentValue.slice(inputElement.selectionEnd);
        if (!decimalRegex.test(nextValue) && !allowedKeys.includes(key)) {
            event.preventDefault();
        }
    }
}

@Directive({
    selector: 'input[numeric-two-digit]'
})
export class NumericTwoDigitDirective {

    constructor(private el: ElementRef) { }

    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        const inputElement = this.el.nativeElement as HTMLInputElement;
        const currentValue = inputElement.value;
        const key = event.key;

        // 取得不需要阻止的非數字按鍵列表
        const allowedKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Backspace', 'Delete', 'Tab'];

        // 檢查輸入值是否符合小數2位的條件
        const decimalRegex = /^\d*\.?\d{0,2}$/;
        const nextValue = currentValue.slice(0, inputElement.selectionStart) + key + currentValue.slice(inputElement.selectionEnd);
        if (!decimalRegex.test(nextValue) && !allowedKeys.includes(key)) {
            event.preventDefault();
        }
    }
}


