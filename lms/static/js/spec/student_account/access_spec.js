define([
    'jquery',
    'common/js/spec_helpers/template_helpers',
    'common/js/spec_helpers/ajax_helpers',
    'js/student_account/views/AccessView',
    'js/student_account/views/FormView',
    'js/student_account/enrollment',
    'js/student_account/shoppingcart',
    'js/student_account/emailoptin'
], function($, TemplateHelpers, AjaxHelpers, AccessView, FormView, EnrollmentInterface, ShoppingCartInterface) {
        "use strict";
        describe('edx.student.account.AccessView', function() {
            var requests = null,
                view = null,
                FORM_DESCRIPTION = {
                    method: 'post',
                    submit_url: '/submit',
                    fields: [
                        {
                            name: 'email',
                            label: 'Email',
                            defaultValue: '',
                            type: 'text',
                            required: true,
                            placeholder: 'xsy@edx.org',
                            instructions: 'Enter your email here.',
                            restrictions: {},
                        },
                        {
                            name: 'username',
                            label: 'Username',
                            defaultValue: '',
                            type: 'text',
                            required: true,
                            placeholder: 'Xsy',
                            instructions: 'Enter your username here.',
                            restrictions: {
                                max_length: 200
                            }
                        }
                    ]
                },
                FORWARD_URL = (
                    '/account/finish_auth' +
                    '?course_id=edx%2FDemoX%2FFall' +
                    '&enrollment_action=enroll' +
                    '&next=%2Fdashboard'
                ),
                THIRD_PARTY_COMPLETE_URL = '/auth/complete/provider/';

            var ajaxSpyAndInitialize = function(that, mode, nextUrl, finishAuthUrl) {
                // Spy on AJAX requests
                requests = AjaxHelpers.requests(that);

                // Initialize the access view
                view = new AccessView({
                    mode: mode,
                    thirdPartyAuth: {
                        currentProvider: null,
                        providers: [],
                        finishAuthUrl: finishAuthUrl
                    },
                    nextUrl: nextUrl, // undefined for default
                    platformName: 'edX',
                    loginFormDesc: FORM_DESCRIPTION,
                    registrationFormDesc: FORM_DESCRIPTION,
                    passwordResetFormDesc: FORM_DESCRIPTION
                });

                // Mock the redirect call
                spyOn( view, 'redirect' ).andCallFake( function() {} );

                // Mock the enrollment and shopping cart interfaces
                spyOn( EnrollmentInterface, 'enroll' ).andCallFake( function() {} );
                spyOn( ShoppingCartInterface, 'addCourseToCart' ).andCallFake( function() {} );
            };

            var assertForms = function(visibleType, hiddenType) {
                expect($(visibleType)).not.toHaveClass('hidden');
                expect($(hiddenType)).toHaveClass('hidden');
                expect($('#password-reset-form')).toHaveClass('hidden');
            };

            var selectForm = function(type) {
                // Create a fake change event to control form toggling
                var changeEvent = $.Event('change');
                changeEvent.currentTarget = $('.form-toggle[data-type="' + type + '"]');

                // Load form corresponding to the change event
                view.toggleForm(changeEvent);
            };

            beforeEach(function() {
                setFixtures('<div id="login-and-registration-container"></div>');
                TemplateHelpers.installTemplate('templates/student_account/access');
                TemplateHelpers.installTemplate('templates/student_account/login');
                TemplateHelpers.installTemplate('templates/student_account/register');
                TemplateHelpers.installTemplate('templates/student_account/password_reset');
                TemplateHelpers.installTemplate('templates/student_account/form_field');

                // Stub analytics tracking
                window.analytics = jasmine.createSpyObj('analytics', ['track', 'page', 'pageview', 'trackLink']);
            });

            it('can initially display the login form', function() {
                ajaxSpyAndInitialize(this, 'login');

                /* Verify that the login form is expanded, and that the
                /* registration form is collapsed.
                 */
                assertForms('#login-form', '#register-form');
            });

            it('can initially display the registration form', function() {
                ajaxSpyAndInitialize(this, 'register');

                /* Verify that the registration form is expanded, and that the
                /* login form is collapsed.
                 */
                assertForms('#register-form', '#login-form');
            });

            it('toggles between the login and registration forms', function() {
                ajaxSpyAndInitialize(this, 'login');

                // Prevent URL from updating
                spyOn(history, 'pushState').andCallFake( function() {} );

                // Simulate selection of the registration form
                selectForm('register');
                assertForms('#register-form', '#login-form');

                // Simulate selection of the login form
                selectForm('login');
                assertForms('#login-form', '#register-form');
            });

            it('displays the reset password form', function() {
                ajaxSpyAndInitialize(this, 'login');

                // Simulate a click on the reset password link
                view.resetPassword();

                // Verify that the login-anchor is hidden
                expect($("#login-anchor")).toHaveClass('hidden');

                // Verify that the password reset form is not hidden
                expect($("#password-reset-form")).not.toHaveClass('hidden');
            });

            it('redirects the user to the dashboard on auth complete', function() {
                ajaxSpyAndInitialize(this, 'register');

                // Trigger auth complete
                view.subview.register.trigger('auth-complete');

                // Since we did not provide a ?next query param, expect a redirect to the dashboard.
                expect( view.redirect ).toHaveBeenCalledWith( '/dashboard' );
            });

            it('proceeds with the third party auth pipeline if active', function() {
                ajaxSpyAndInitialize(this, 'register', '/', THIRD_PARTY_COMPLETE_URL);

                // Trigger auth complete
                view.subview.register.trigger('auth-complete');

                // Verify that we were redirected
                expect( view.redirect ).toHaveBeenCalledWith( THIRD_PARTY_COMPLETE_URL );
            });

            it('redirects the user to the next page on auth complete', function() {
                // The 'next' argument is often used to redirect to the auto-enrollment view
                ajaxSpyAndInitialize(this, 'register', FORWARD_URL);

                // Trigger auth complete
                view.subview.register.trigger('auth-complete');

                // Verify that we were redirected
                expect( view.redirect ).toHaveBeenCalledWith( FORWARD_URL );
            });

            it('ignores redirect to external URLs', function() {
                ajaxSpyAndInitialize(this, 'register', "http://www.example.com");

                // Trigger auth complete
                view.subview.register.trigger('auth-complete');

                // Expect that we ignore the external URL and redirect to the dashboard
                expect( view.redirect ).toHaveBeenCalledWith( "/dashboard" );
            });

        });
    }
);
