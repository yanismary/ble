import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'uppercasefirst',
})
export class UppercasefirstPipe implements PipeTransform {
  /**
   * Takes a value and make the first caracter uppercase.
   */
  transform(value: string): string {
    if (value === null) return 'Not assigned';
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
