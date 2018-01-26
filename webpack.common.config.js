/* eslint-env node */

'use strict';

var path = require('path');
var webpack = require('webpack');
var BundleTracker = require('webpack-bundle-tracker');
var StringReplace = require('string-replace-webpack-plugin');

var files = require('./webpack-config/file-lists.js');

var filesWithRequireJSBlocks = [
    path.resolve(__dirname, 'common/static/common/js/components/utils/view_utils.js'),
];

var defineHeader = /\(function ?\(((define|require|requirejs|\$)(, )?)+\) ?\{/;
var defineCallFooter = /\}\)\.call\(this, ((define|require)( \|\| RequireJS\.(define|require))?(, )?)+?\);/;
var defineDirectFooter = /\}\(((window\.)?(RequireJS\.)?(requirejs|define|require|jQuery)(, )?)+\)\);/;
var defineFancyFooter = /\}\).call\(\s*this(\s|.)*define(\s|.)*\);/;
var defineFooter = new RegExp('(' + defineCallFooter.source + ')|(' + defineDirectFooter.source + ')|(' + defineFancyFooter.source + ')', 'm');

module.exports = {
    context: __dirname,

    entry: {
        // Studio
        Import: './cms/static/js/features/import/factories/import.js',
        CourseOrLibraryListing: './cms/static/js/features_jsx/studio/CourseOrLibraryListing.jsx',
        'js/pages/login': './cms/static/js/pages/login.js',
        'js/pages/textbooks': './cms/static/js/pages/textbooks.js',
        'js/pages/container': './cms/static/js/pages/container.js',
        'js/sock': './cms/static/js/sock.js',

        // LMS
        SingleSupportForm: './lms/static/support/jsx/single_support_form.jsx',
        AlertStatusBar: './lms/static/js/accessible_components/StatusBarAlert.jsx',
        LearnerAnalyticsDashboard: './lms/static/js/learner_analytics_dashboard/LearnerAnalyticsDashboard.jsx',
        UpsellExperimentModal: './lms/static/common/js/components/UpsellExperimentModal.jsx',
        PortfolioExperimentUpsellModal: './lms/static/common/js/components/PortfolioExperimentUpsellModal.jsx',
        EntitlementSupportPage: './lms/djangoapps/support/static/support/jsx/entitlements/index.jsx',
        PasswordResetConfirmation: './lms/static/js/student_account/components/PasswordResetConfirmation.jsx',
        StudentAccountDeletion: './lms/static/js/student_account/components/StudentAccountDeletion.jsx',
        StudentAccountDeletionInitializer: './lms/static/js/student_account/StudentAccountDeletionInitializer.js',

        // Learner Dashboard
        EntitlementFactory: './lms/static/js/learner_dashboard/course_entitlement_factory.js',
        EntitlementUnenrollmentFactory: './lms/static/js/learner_dashboard/entitlement_unenrollment_factory.js',
        ProgramDetailsFactory: './lms/static/js/learner_dashboard/program_details_factory.js',
        ProgramListFactory: './lms/static/js/learner_dashboard/program_list_factory.js',
        UnenrollmentFactory: './lms/static/js/learner_dashboard/unenrollment_factory.js',
        ViewedEvent: './lms/static/completion/js/ViewedEvent.js',

        // Features
        CourseGoals: './openedx/features/course_experience/static/course_experience/js/CourseGoals.js',
        CourseHome: './openedx/features/course_experience/static/course_experience/js/CourseHome.js',
        CourseOutline: './openedx/features/course_experience/static/course_experience/js/CourseOutline.js',
        CourseSock: './openedx/features/course_experience/static/course_experience/js/CourseSock.js',
        CourseTalkReviews: './openedx/features/course_experience/static/course_experience/js/CourseTalkReviews.js',
        Currency: './openedx/features/course_experience/static/course_experience/js/currency.js',
        Enrollment: './openedx/features/course_experience/static/course_experience/js/Enrollment.js',
        LatestUpdate: './openedx/features/course_experience/static/course_experience/js/LatestUpdate.js',
        WelcomeMessage: './openedx/features/course_experience/static/course_experience/js/WelcomeMessage.js',

        CookiePolicyBanner: './common/static/js/src/CookiePolicyBanner.jsx',

        // Common
        ReactRenderer: './common/static/js/src/ReactRenderer.jsx'
    },

    output: {
        path: path.resolve(__dirname, 'common/static/bundles'),
        libraryTarget: 'window'
    },

    plugins: [
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.NamedModulesPlugin(),
        new BundleTracker({
            path: process.env.STATIC_ROOT_CMS,
            filename: 'webpack-stats.json'
        }),
        new BundleTracker({
            path: process.env.STATIC_ROOT_LMS,
            filename: 'webpack-stats.json'
        }),
        new webpack.ProvidePlugin({
            _: 'underscore',
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
            Popper: 'popper.js', // used by bootstrap
            CodeMirror: 'codemirror',
        }),

        // Note: Until karma-webpack releases v3, it doesn't play well with
        // the CommonsChunkPlugin. We have a kludge in karma.common.conf.js
        // that dynamically removes this plugin from webpack config when
        // running those tests (the details are in that file). This is a
        // recommended workaround, as this plugin is just an optimization. But
        // because of this, we really don't want to get too fancy with how we
        // invoke this plugin until we can upgrade karma-webpack.
        new webpack.optimize.CommonsChunkPlugin({
            // If the value below changes, update the render_bundle call in
            // common/djangoapps/pipeline_mako/templates/static_content.html
            name: 'commons',
            filename: 'commons.js',
            minChunks: 3
        })
    ],

    module: {
        noParse: [
            // See sinon/webpack interaction weirdness:
            // https://github.com/webpack/webpack/issues/304#issuecomment-272150177
            // (I've tried every other suggestion solution on that page, this
            // was the only one that worked.)
            /\/sinon\.js|codemirror-compressed\.js/
        ],
        rules: [
            {
                test: files.namespacedRequire.concat(files.textBangUnderscore, filesWithRequireJSBlocks),
                loader: StringReplace.replace(
                    ['babel-loader'],
                    {
                        replacements: [
                            {
                                pattern: defineHeader,
                                replacement: function() { return ''; }
                            },
                            {
                                pattern: defineFooter,
                                replacement: function() { return ''; }
                            },
                            {
                                pattern: /(\/\* RequireJS) \*\//g,
                                replacement: function(match, p1) { return p1; }
                            },
                            {
                                pattern: /\/\* Webpack/g,
                                replacement: function(match) { return match + ' */'; }
                            },
                            {
                                pattern: /text!(.*?\.underscore)/g,
                                replacement: function(match, p1) { return p1; }
                            },
                            {
                                pattern: /RequireJS.require/g,
                                replacement: function() {
                                    return 'require';
                                }
                            }
                        ]
                    }
                )
            },
            {
                test: /\.(js|jsx)$/,
                exclude: [
                    /node_modules/,
                    files.namespacedRequire,
                    files.textBangUnderscore,
                    filesWithRequireJSBlocks
                ],
                use: 'babel-loader'
            },
            {
                test: /\.(js|jsx)$/,
                include: [
                    /paragon/
                ],
                use: 'babel-loader'
            },
            {
                test: path.resolve(__dirname, 'common/static/js/src/ajax_prefix.js'),
                use: [
                    'babel-loader',
                    {
                        loader: 'exports-loader',
                        options: {
                            'this.AjaxPrefix': true
                        }
                    }
                ]
            },
            {
                test: /\.underscore$/,
                use: 'raw-loader'
            },
            {
                // This file is used by both RequireJS and Webpack and depends on window globals
                // This is a dirty hack and shouldn't be replicated for other files.
                test: path.resolve(__dirname, 'cms/static/cms/js/main.js'),
                loader: StringReplace.replace(
                    ['babel-loader'],
                    {
                        replacements: [
                            {
                                pattern: /\(function\(AjaxPrefix\) {/,
                                replacement: function() { return ''; }
                            },
                            {
                                pattern: /], function\(domReady, \$, str, Backbone, gettext, NotificationView\) {/,
                                replacement: function() {
                                    // eslint-disable-next-line
                                    return '], function(domReady, $, str, Backbone, gettext, NotificationView, AjaxPrefix) {';
                                }
                            },
                            {
                                pattern: /'..\/..\/common\/js\/components\/views\/feedback_notification',/,
                                replacement: function() {
                                    return "'../../common/js/components/views/feedback_notification', 'AjaxPrefix',";
                                }
                            },
                            {
                                pattern: /}\).call\(this, AjaxPrefix\);/,
                                replacement: function() { return ''; }
                            }
                        ]
                    }
                )
            },
            {
                test: /\.(woff2?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'file-loader'
            },
            {
                test: /\.svg$/,
                loader: 'svg-inline-loader'
            },
            {
                test: /xblock\/core/,
                loader: 'exports-loader?this.XBlock!imports-loader?jquery,jquery.immediateDescendents'
            },
            {
                test: /xblock\/runtime.v1/,
                loader: 'exports-loader?XBlock!imports-loader?XBlock=xblock/core'
            },
            {
                test: /codemirror/,
                loader: 'exports-loader?window.CodeMirror'
            },
            {
                test: /tinymce/,
                loader: 'imports-loader?this=>window'
            }
        ]
    },

    resolve: {
        extensions: ['.js', '.jsx', '.json'],
        alias: {
            AjaxPrefix: 'ajax_prefix',
            accessibility: 'accessibility_tools',
            codemirror: 'codemirror-compressed',
            datepair: 'timepicker/datepair',
            'edx-ui-toolkit': 'edx-ui-toolkit/src/',  // @TODO: some paths in toolkit are not valid relative paths
            ieshim: 'ie_shim',
            jquery: 'jquery/src/jquery',  // Use the non-diqst form of jQuery for better debugging + optimization
            'jquery.flot': 'flot/jquery.flot.min',
            'jquery.ui': 'jquery-ui.min',
            'jquery.tinymce': 'tinymce/jquery.tinymce.min',
            'jquery.inputnumber': 'html5-input-polyfills/number-polyfill',
            'jquery.qtip': 'jquery.qtip.min',
            'jquery.smoothScroll': 'jquery.smooth-scroll.min',
            'jquery.timepicker': 'timepicker/jquery.timepicker',
            'backbone.associations': 'backbone-associations/backbone-associations-min',

            // See sinon/webpack interaction weirdness:
            // https://github.com/webpack/webpack/issues/304#issuecomment-272150177
            // (I've tried every other suggestion solution on that page, this
            // was the only one that worked.)
            sinon: __dirname + '/node_modules/sinon/pkg/sinon.js',
            WordCloudMain: 'xmodule/assets/word_cloud/public/js/word_cloud_main',
        },
        modules: [
            'cms/djangoapps/pipeline_js/js',
            'cms/static',
            'cms/static/cms/js',
            'common/lib/xmodule',
            'common/lib/xmodule/xmodule/js/src',
            'common/static',
            'common/static/coffee/src',
            'common/static/common/js',
            'common/static/common/js/vendor/',
            'common/static/js/src',
            'common/static/js/vendor/',
            'common/static/js/vendor/jQuery-File-Upload/js/',
            'common/static/js/vendor/tinymce/js/tinymce',
            'node_modules',
            'common/static/xmodule',
        ]
    },

    resolveLoader: {
        alias: {
            text: 'raw-loader'  // Compatibility with RequireJSText's text! loader, uses raw-loader under the hood
        }
    },

    externals: {
        backbone: 'Backbone',
        coursetalk: 'CourseTalk',
        gettext: 'gettext',
        jquery: 'jQuery',
        logger: 'Logger',
        underscore: '_',
        URI: 'URI',
        XModule: 'XModule',
        XBlockToXModuleShim: 'XBlockToXModuleShim',
    },

    watchOptions: {
        poll: true
    }
};
