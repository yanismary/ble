import { OnInit, Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { LoggerService } from '../../providers/logger/logger.service';

type TutorialProduct = 'widoor' | 'moventiv';

interface TutorialSlide {
  title: string;
  description: string;
  image?: string;
}

@IonicPage()
@Component({
  selector: 'page-infoSlide',
  templateUrl: 'infoSlide.html',
})
export class InfoSlidePage implements OnInit {
  slides: TutorialSlide[] = [];
  slidesWidoor: TutorialSlide[] = [];
  slidesMoventiv: TutorialSlide[] = [];
  selectedTutorial: TutorialProduct | null = null;
  selectedReadyTitle: string = '';
  readyWidoor: string = '';
  readyMoventiv: string = '';
  private TAG = 'InfoSlidePage';

  constructor(
    public platform: Platform,
    public navCtrl: NavController,
    public navParams: NavParams,
    private logger: LoggerService,
    private translate: TranslateService,
  ) { }


  ngOnInit(): any {
    this.logger.debug(this.TAG, 'ngOnInit started');

    const platformKey = this.platform.is('ios') ? 'IOS' : 'ANDROID';

    this.translate.get([
        'INFOSLIDE.SLIDE1.TITLE', 'INFOSLIDE.SLIDE1.DESC', 
        'INFOSLIDE.SLIDE2.TITLE', 'INFOSLIDE.SLIDE2.DESC', 
        'INFOSLIDE.SLIDE3.TITLE', 'INFOSLIDE.SLIDE3.DESC', 
        'INFOSLIDE.SLIDE4.TITLE', 'INFOSLIDE.SLIDE4.DESC', 
        'INFOSLIDE.SLIDE5.TITLE', 'INFOSLIDE.SLIDE5.DESC', 
        'INFOSLIDE.SLIDE6.TITLE', 'INFOSLIDE.SLIDE6.DESC',
        'INFOSLIDE.SLIDE7.' + platformKey + '.TITLE',
        'INFOSLIDE.SLIDE7.' + platformKey + '.DESC',
        'INFOSLIDE.SLIDE8.' + platformKey + '.TITLE',
        'INFOSLIDE.SLIDE8.' + platformKey + '.DESC',
        'INFOSLIDE.END.READY'
      ]).subscribe(res => {
        this.logger.info(this.TAG, 'Slides loaded');
        this.readyWidoor = this.productText(res["INFOSLIDE.END.READY"], 'widoor');
        this.readyMoventiv = this.productText(res["INFOSLIDE.END.READY"], 'moventiv');
        this.slidesWidoor = this.buildSlides(res, platformKey, 'widoor');
        this.slidesMoventiv = this.buildSlides(res, platformKey, 'moventiv');
        this.applySelectedTutorial();
      });

    this.logger.info(this.TAG, 'Platform detected', {
      android: this.platform.is('android'),
      ios: this.platform.is('ios')
    });
  }

  selectTutorial(product: TutorialProduct) {
    this.selectedTutorial = product;
    this.applySelectedTutorial();
    this.logger.info(this.TAG, 'Tutorial selected', { product: product });
  }

  private applySelectedTutorial() {
    if (!this.selectedTutorial) {
      this.slides = [];
      this.selectedReadyTitle = '';
      return;
    }

    this.slides = this.selectedTutorial === 'widoor' ? this.slidesWidoor : this.slidesMoventiv;
    this.selectedReadyTitle = this.selectedTutorial === 'widoor' ? this.readyWidoor : this.readyMoventiv;
  }

  private buildSlides(res: any, platformKey: string, product: TutorialProduct): TutorialSlide[] {
    const images = this.getSlideImages(product);

    return [
      {
        title: this.productText(res["INFOSLIDE.SLIDE1.TITLE"], product),
        description: this.productText(res["INFOSLIDE.SLIDE1.DESC"], product),
        image: images.slide1
      },
      {
        title: this.productText(res["INFOSLIDE.SLIDE2.TITLE"], product),
        description: this.productText(res["INFOSLIDE.SLIDE2.DESC"], product),
        image: images.slide2
      },
      {
        title: this.productText(res["INFOSLIDE.SLIDE3.TITLE"], product),
        description: this.productText(res["INFOSLIDE.SLIDE3.DESC"], product),
        image: images.slide3
      },
      {
        title: this.productText(res["INFOSLIDE.SLIDE4.TITLE"], product),
        description: this.productText(res["INFOSLIDE.SLIDE4.DESC"], product),
        image: images.slide4
      },
      {
        title: this.productText(res["INFOSLIDE.SLIDE5.TITLE"], product),
        description: this.productText(res["INFOSLIDE.SLIDE5.DESC"], product),
        image: images.slide5
      },
      {
        title: this.productText(res["INFOSLIDE.SLIDE6.TITLE"], product),
        description: this.productText(res["INFOSLIDE.SLIDE6.DESC"], product),
        image: images.slide6
      },
      {
        title: this.productText(res["INFOSLIDE.SLIDE7." + platformKey + ".TITLE"], product),
        description: this.productText(res["INFOSLIDE.SLIDE7." + platformKey + ".DESC"], product)
      },
      {
        title: this.productText(res["INFOSLIDE.SLIDE8." + platformKey + ".TITLE"], product),
        description: this.productText(res["INFOSLIDE.SLIDE8." + platformKey + ".DESC"], product)
      },
    ];
  }

  private getSlideImages(product: TutorialProduct) {
    const basePath = 'assets/img/tuto_' + product + '/';
    const lang = localStorage.getItem("lang") === "fr" ? "fr" : "en";

    if (this.platform.is('ios')) {
      return {
        slide1: basePath + 'slide1_' + product + '.png',
        slide2: basePath + 'slide2_ios_' + lang + '_' + product + '.PNG',
        slide3: basePath + 'slide3_ios_' + lang + '_' + product + '.PNG',
        slide4: basePath + 'slide4_ios_' + lang + '_' + product + '.PNG',
        slide5: basePath + 'slide5_ios_' + lang + '_' + product + '.PNG',
        slide6: basePath + 'slide6_ios_' + lang + '_' + product + '.PNG'
      };
    }

    return {
      slide1: basePath + 'slide1_' + product + '.png',
      slide2: basePath + 'slide2_android_' + lang + '_' + product + '.jpg',
      slide3: basePath + 'slide3_android_' + lang + '_' + product + '.jpg',
      slide4: basePath + 'slide4_android_' + lang + '_' + product + '.jpg',
      slide5: basePath + 'slide5_android_' + lang + '_' + product + '.jpg',
      slide6: basePath + 'slide6_android_' + lang + '_' + product + '.jpg'
    };
  }

  private productText(value: string, product: TutorialProduct): string {
    if (!value) {
      return value;
    }

    if (product === 'widoor') {
      return value
        .replace(/MOVENTIV/g, 'WIDOOR')
        .replace(/Moventiv/g, 'Widoor')
        .replace(/moventiv/g, 'widoor');
    }

    return value
      .replace(/WIDOOR/g, 'MOVENTIV')
      .replace(/WIDOR/g, 'MOVENTIV')
      .replace(/Widoor/g, 'Moventiv')
      .replace(/widoor/g, 'moventiv');
  }

  ionViewDidEnter() {
    //cosmetic"",
  }

  pushScan() {
    this.navCtrl.push('ScanPage');
    this.logger.debug(this.TAG, 'Navigating to ScanPage');
  }

  ionViewDidLoad() {
    this.logger.debug(this.TAG, 'ionViewDidLoad');
  }

}
