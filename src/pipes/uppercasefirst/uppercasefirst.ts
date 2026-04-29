import { Pipe, PipeTransform } from '@angular/core';

/**
 * Generated class for the UppercasefirstPipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'uppercasefirst',
})
export class UppercasefirstPipe implements PipeTransform {
  /**
   * Takes a value and make the first caracter uppercase.
   */
  transform(value: string, args: any[]): string {
    if (value === null) return 'Not assigned';
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
