'use strict';


customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">widoor_actuator documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                        <li class="link">
                            <a href="dependencies.html" data-type="chapter-link">
                                <span class="icon ion-ios-list"></span>Dependencies
                            </a>
                        </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                'data-target="#modules-links"' : 'data-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse" ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AboutPageModule.html" data-type="entity-link">AboutPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-AboutPageModule-169b16d5b10df353d4955beff9974a59"' : 'data-target="#xs-components-links-module-AboutPageModule-169b16d5b10df353d4955beff9974a59"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AboutPageModule-169b16d5b10df353d4955beff9974a59"' :
                                            'id="xs-components-links-module-AboutPageModule-169b16d5b10df353d4955beff9974a59"' }>
                                            <li class="link">
                                                <a href="components/AboutPage.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">AboutPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link">AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-AppModule-7189224bdd1a3fa1f281e26aa2582dbc"' : 'data-target="#xs-components-links-module-AppModule-7189224bdd1a3fa1f281e26aa2582dbc"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppModule-7189224bdd1a3fa1f281e26aa2582dbc"' :
                                            'id="xs-components-links-module-AppModule-7189224bdd1a3fa1f281e26aa2582dbc"' }>
                                            <li class="link">
                                                <a href="components/MyApp.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">MyApp</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-AppModule-7189224bdd1a3fa1f281e26aa2582dbc"' : 'data-target="#xs-injectables-links-module-AppModule-7189224bdd1a3fa1f281e26aa2582dbc"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-7189224bdd1a3fa1f281e26aa2582dbc"' :
                                        'id="xs-injectables-links-module-AppModule-7189224bdd1a3fa1f281e26aa2582dbc"' }>
                                        <li class="link">
                                            <a href="injectables/BleconnectserviceProvider.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>BleconnectserviceProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/DataProvider.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>DataProvider</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/RandBLE.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>RandBLE</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ContactPageModule.html" data-type="entity-link">ContactPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-ContactPageModule-040db5fea34199f610bb4348e6a1ec2b"' : 'data-target="#xs-components-links-module-ContactPageModule-040db5fea34199f610bb4348e6a1ec2b"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ContactPageModule-040db5fea34199f610bb4348e6a1ec2b"' :
                                            'id="xs-components-links-module-ContactPageModule-040db5fea34199f610bb4348e6a1ec2b"' }>
                                            <li class="link">
                                                <a href="components/ContactPage.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ContactPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/MoventivPageModule.html" data-type="entity-link">MoventivPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-MoventivPageModule-e472d0dca6cf6333502c8620b43b4fbc"' : 'data-target="#xs-components-links-module-MoventivPageModule-e472d0dca6cf6333502c8620b43b4fbc"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-MoventivPageModule-e472d0dca6cf6333502c8620b43b4fbc"' :
                                            'id="xs-components-links-module-MoventivPageModule-e472d0dca6cf6333502c8620b43b4fbc"' }>
                                            <li class="link">
                                                <a href="components/MoventivPage.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">MoventivPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/GcuPageModule.html" data-type="entity-link">GcuPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-GcuPageModule-571c90d62ca69969525ab3a87e61c3d6"' : 'data-target="#xs-components-links-module-GcuPageModule-571c90d62ca69969525ab3a87e61c3d6"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-GcuPageModule-571c90d62ca69969525ab3a87e61c3d6"' :
                                            'id="xs-components-links-module-GcuPageModule-571c90d62ca69969525ab3a87e61c3d6"' }>
                                            <li class="link">
                                                <a href="components/GcuPage.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">GcuPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/InfoSlidePageModule.html" data-type="entity-link">InfoSlidePageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-InfoSlidePageModule-5fa2862c946cabb3c7ea7ad9030672c6"' : 'data-target="#xs-components-links-module-InfoSlidePageModule-5fa2862c946cabb3c7ea7ad9030672c6"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-InfoSlidePageModule-5fa2862c946cabb3c7ea7ad9030672c6"' :
                                            'id="xs-components-links-module-InfoSlidePageModule-5fa2862c946cabb3c7ea7ad9030672c6"' }>
                                            <li class="link">
                                                <a href="components/InfoSlidePage.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">InfoSlidePage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ParamPageModule.html" data-type="entity-link">ParamPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-ParamPageModule-388d903d90c91dff4077781ae7c97b3b"' : 'data-target="#xs-components-links-module-ParamPageModule-388d903d90c91dff4077781ae7c97b3b"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ParamPageModule-388d903d90c91dff4077781ae7c97b3b"' :
                                            'id="xs-components-links-module-ParamPageModule-388d903d90c91dff4077781ae7c97b3b"' }>
                                            <li class="link">
                                                <a href="components/ParamPage.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ParamPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/PipesModule.html" data-type="entity-link">PipesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#pipes-links-module-PipesModule-0f4b165baaefe4eea3762c4f9812ff95"' : 'data-target="#xs-pipes-links-module-PipesModule-0f4b165baaefe4eea3762c4f9812ff95"' }>
                                            <span class="icon ion-md-add"></span>
                                            <span>Pipes</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="pipes-links-module-PipesModule-0f4b165baaefe4eea3762c4f9812ff95"' :
                                            'id="xs-pipes-links-module-PipesModule-0f4b165baaefe4eea3762c4f9812ff95"' }>
                                            <li class="link">
                                                <a href="pipes/UppercasefirstPipe.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">UppercasefirstPipe</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/PopoverPageModule.html" data-type="entity-link">PopoverPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-PopoverPageModule-132ed52bdc51ba478c4e06472f3cd452"' : 'data-target="#xs-components-links-module-PopoverPageModule-132ed52bdc51ba478c4e06472f3cd452"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-PopoverPageModule-132ed52bdc51ba478c4e06472f3cd452"' :
                                            'id="xs-components-links-module-PopoverPageModule-132ed52bdc51ba478c4e06472f3cd452"' }>
                                            <li class="link">
                                                <a href="components/PopoverPage.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">PopoverPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ScanPageModule.html" data-type="entity-link">ScanPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-ScanPageModule-19f48fe90d1ce5c649fb50eaa1ad9a76"' : 'data-target="#xs-components-links-module-ScanPageModule-19f48fe90d1ce5c649fb50eaa1ad9a76"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ScanPageModule-19f48fe90d1ce5c649fb50eaa1ad9a76"' :
                                            'id="xs-components-links-module-ScanPageModule-19f48fe90d1ce5c649fb50eaa1ad9a76"' }>
                                            <li class="link">
                                                <a href="components/ScanPage.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ScanPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/WidoorPageModule.html" data-type="entity-link">WidoorPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-WidoorPageModule-5609b5df88a5078da3f42ed349b8fbc7"' : 'data-target="#xs-components-links-module-WidoorPageModule-5609b5df88a5078da3f42ed349b8fbc7"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-WidoorPageModule-5609b5df88a5078da3f42ed349b8fbc7"' :
                                            'id="xs-components-links-module-WidoorPageModule-5609b5df88a5078da3f42ed349b8fbc7"' }>
                                            <li class="link">
                                                <a href="components/WidoorPage.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">WidoorPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#classes-links"' :
                            'data-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse" ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/FadeTansition.html" data-type="entity-link">FadeTansition</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interfaces-links"' :
                            'data-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse" ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/ICharacteristicPath.html" data-type="entity-link">ICharacteristicPath</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse" ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});