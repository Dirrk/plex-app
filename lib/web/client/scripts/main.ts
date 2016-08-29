import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app.module';
console.log('test');
platformBrowserDynamic().bootstrapModule(AppModule);
