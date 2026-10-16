// COMPONENT TYPE: Pure Pipe
// SECTION: Angular Basics
// ROLE: Format a readonly list without mutating its source.
// PATTERNS USED: Pure transformation with an explicit separator parameter.
// NOTES FOR CONTRIBUTORS: Do not add side effects, subscriptions or input mutations.
import { Pipe, PipeTransform } from '@angular/core';

/** Formats labels for display. @example {{ labels | tagList:' / ' }} */
@Pipe({ name: 'tagList', pure: true })
export class TagListPipe implements PipeTransform {
  transform(labels: readonly string[], separator = ' · '): string {
    return labels.join(separator);
  }
}
