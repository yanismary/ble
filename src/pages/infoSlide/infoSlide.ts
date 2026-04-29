import { OnInit, Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage';
import { LoggerService } from '../../providers/logger/logger.service';


/**
 * Generated class for the InfoSlidePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-infoSlide',
  templateUrl: 'infoSlide.html',
})
export class InfoSlidePage implements OnInit {
  slides: any[] = [];
  imageSlide2: string;
  imageSlide3: string;
  imageSlide4: string;
  imageSlide5: string;
  imageSlide6: string;
  private TAG = 'InfoSlidePage';

  constructor(
    public platform: Platform,
    public navCtrl: NavController,
    public navParams: NavParams,
    private logger: LoggerService,
    private translate: TranslateService,
    private storage: Storage,
  ) { }


  ngOnInit(): any {
    this.logger.debug(this.TAG, 'ngOnInit started');

    if (this.platform.is('android')) {
      if (localStorage.getItem("lang") == "fr") {
        this.imageSlide2 = "./assets/img/slide2_android_fr.jpg";
        this.imageSlide3 = "./assets/img/slide3_android_fr.jpg";
        this.imageSlide4 = "./assets/img/slide4_android_fr.jpg";
        this.imageSlide5 = "./assets/img/slide5_android_fr.jpg";
        this.imageSlide6 = "./assets/img/slide6_android_fr.jpg";
      }
      else {
        this.imageSlide2 = "./assets/img/slide2_android_en.jpg";
        this.imageSlide3 = "./assets/img/slide3_android_en.jpg";
        this.imageSlide4 = "./assets/img/slide4_android_en.jpg";
        this.imageSlide5 = "./assets/img/slide5_android_en.jpg";
        this.imageSlide6 = "./assets/img/slide6_android_en.jpg";
      }
    }
    else if (this.platform.is('ios')) {
      if (localStorage.getItem("lang") == "fr") {
        this.imageSlide2 = "./assets/img/slide2_ios_fr.png";
        this.imageSlide3 = "./assets/img/slide3_ios_fr.png";
        this.imageSlide4 = "./assets/img/slide4_ios_fr.png";
        this.imageSlide5 = "./assets/img/slide5_ios_fr.png";
        this.imageSlide6 = "./assets/img/slide6_ios_fr.png";
      }
      else {
        this.imageSlide2 = "./assets/img/slide2_ios_en.png";
        this.imageSlide3 = "./assets/img/slide3_ios_en.png";
        this.imageSlide4 = "./assets/img/slide4_ios_en.png";
        this.imageSlide5 = "./assets/img/slide5_ios_en.png";
        this.imageSlide6 = "./assets/img/slide6_ios_en.png";
      }
    }
    

    if (this.platform.is('android')) {
      this.translate.get([
        'INFOSLIDE.SLIDE1.TITLE', 'INFOSLIDE.SLIDE1.DESC', 
        'INFOSLIDE.SLIDE2.TITLE', 'INFOSLIDE.SLIDE2.DESC', 
        'INFOSLIDE.SLIDE3.TITLE', 'INFOSLIDE.SLIDE3.DESC', 
        'INFOSLIDE.SLIDE4.TITLE', 'INFOSLIDE.SLIDE4.DESC', 
        'INFOSLIDE.SLIDE5.TITLE', 'INFOSLIDE.SLIDE5.DESC', 
        'INFOSLIDE.SLIDE6.TITLE', 'INFOSLIDE.SLIDE6.DESC',
        'INFOSLIDE.SLIDE7.ANDROID.TITLE', 'INFOSLIDE.SLIDE7.ANDROID.DESC',
        'INFOSLIDE.SLIDE8.ANDROID.TITLE', 'INFOSLIDE.SLIDE8.ANDROID.DESC',  
      ]
      ).subscribe(
        res => {
          this.logger.info(this.TAG, 'Slides loaded');
          this.slides = [
            {
              title: res["INFOSLIDE.SLIDE1.TITLE"],
              description: res["INFOSLIDE.SLIDE1.DESC"],
              image: "./assets/img/slide1.png"
            },
            {
              title: res["INFOSLIDE.SLIDE2.TITLE"],
              description: res["INFOSLIDE.SLIDE2.DESC"],
              image: this.imageSlide2
            },
            {
              title: res["INFOSLIDE.SLIDE3.TITLE"],
              description: res["INFOSLIDE.SLIDE3.DESC"],
              image: this.imageSlide3
            },
            {
              title: res["INFOSLIDE.SLIDE4.TITLE"],
              description: res["INFOSLIDE.SLIDE4.DESC"],
              image: this.imageSlide4
            },
            {
              title: res["INFOSLIDE.SLIDE5.TITLE"],
              description: res["INFOSLIDE.SLIDE5.DESC"],
              image: this.imageSlide5
            },
            {
              title: res["INFOSLIDE.SLIDE6.TITLE"],
              description: res["INFOSLIDE.SLIDE6.DESC"],
              image: this.imageSlide6
            },
            {
              title: res["INFOSLIDE.SLIDE7.ANDROID.TITLE"],
              description: res["INFOSLIDE.SLIDE7.ANDROID.DESC"]
            },
            {
              title: res["INFOSLIDE.SLIDE8.ANDROID.TITLE"],
              description: res["INFOSLIDE.SLIDE8.ANDROID.DESC"]
            },
          ];
        }
      );
    }
    else if (this.platform.is('ios')) {
      this.translate.get([
      'INFOSLIDE.SLIDE1.TITLE', 'INFOSLIDE.SLIDE1.DESC', 
      'INFOSLIDE.SLIDE2.TITLE', 'INFOSLIDE.SLIDE2.DESC', 
      'INFOSLIDE.SLIDE3.TITLE', 'INFOSLIDE.SLIDE3.DESC', 
      'INFOSLIDE.SLIDE4.TITLE', 'INFOSLIDE.SLIDE4.DESC', 
      'INFOSLIDE.SLIDE5.TITLE', 'INFOSLIDE.SLIDE5.DESC', 
      'INFOSLIDE.SLIDE6.TITLE', 'INFOSLIDE.SLIDE6.DESC',
      'INFOSLIDE.SLIDE7.IOS.TITLE', 'INFOSLIDE.SLIDE7.IOS.DESC',
      'INFOSLIDE.SLIDE8.IOS.TITLE', 'INFOSLIDE.SLIDE8.IOS.DESC',  
    ]
      ).subscribe(
        res => {
          this.logger.info(this.TAG, 'Slides loaded');
          this.slides = [
            {
              title: res["INFOSLIDE.SLIDE1.TITLE"],
              description: res["INFOSLIDE.SLIDE1.DESC"],
              image: "./assets/img/slide1.png"
            },
            {
              title: res["INFOSLIDE.SLIDE2.TITLE"],
              description: res["INFOSLIDE.SLIDE2.DESC"],
              image: this.imageSlide2
            },
            {
              title: res["INFOSLIDE.SLIDE3.TITLE"],
              description: res["INFOSLIDE.SLIDE3.DESC"],
              image: this.imageSlide3
            },
            {
              title: res["INFOSLIDE.SLIDE4.TITLE"],
              description: res["INFOSLIDE.SLIDE4.DESC"],
              image: this.imageSlide4
            },
            {
              title: res["INFOSLIDE.SLIDE5.TITLE"],
              description: res["INFOSLIDE.SLIDE5.DESC"],
              image: this.imageSlide5
            },
            {
              title: res["INFOSLIDE.SLIDE6.TITLE"],
              description: res["INFOSLIDE.SLIDE6.DESC"],
              image: this.imageSlide6
            },
            {
              title: res["INFOSLIDE.SLIDE7.IOS.TITLE"],
              description: res["INFOSLIDE.SLIDE7.IOS.DESC"]
      
            },
            {
              title: res["INFOSLIDE.SLIDE8.IOS.TITLE"],
              description: res["INFOSLIDE.SLIDE8.IOS.DESC"]
      
            },
          ];
        });
    }
    this.logger.info(this.TAG, 'Platform detected', {
      android: this.platform.is('android'),
      ios: this.platform.is('ios')
    });
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
