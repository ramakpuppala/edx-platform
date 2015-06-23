/**
 * A generic paging collection for use with a ListView, PagingHeader, and PagingFooter.
 *
 * By default this collection is designed to work with Django Rest Framework APIs, but can be configured to work with
 * others. There is support for ascending or descending sort on a particular field, as well as filtering on a field.
 * While the backend API may use either zero or one indexed page numbers, this collection uniformly exposes a one
 * indexed interface to make consumption easier for views.
 *
 * Subclasses may want to override the following properties:
 *      - url (string): The base url for the API endpoint.
 *      - isZeroIndexed (boolean): If true, API calls will use page numbers starting at zero. Defaults to false.
 *      - perPage (number): Count of elements to fetch for each page.
 *      - server_api (object): Query parameters for the API call. Subclasses may add entries as necessary. By default,
 *          a 'sort_order' field is included to specify the field to sort on. This field may be removed for subclasses
 *          that do not support sort ordering, or support it in a non-standard way. By default filterField and
 *          sortDirection do not affect the API calls. It is up to subclasses to add this information to the appropriate
 *          query string parameters in server_api.
 */
;(function (define) {
    'use strict';
    define(['backbone.paginator'], function (BackbonePaginator) {
        var PagingCollection = BackbonePaginator.requestPager.extend({
            paginator_core: {
                type: 'GET',
                dataType: 'json',
                url: function () { return this.url; }
            },

            paginator_ui: {
                firstPage: function () { return this.isZeroIndexed ? 0 : 1; },
                currentPage: function () { return this.isZeroIndexed ? 0 : 1; },
                perPage: function () { return this.perPage; }
            },

            server_api: {
                'page': function () { return this.currentPage; },
                'page_size': function () { return this.perPage; },
                'sort_order': function () { return this.sortField; }
            },

            parse: function (response) {
                this.totalCount = response.count;
                this.currentPage = response.current_page;
                this.totalPages = response.num_pages;
                this.start = response.start;
                return response.results;
            },

            isZeroIndexed: false,
            perPage: 10,

            sortField: '',
            sortDirection: 'descending',
            sortableFields: {},

            filterField: '',
            filterableFields: {},

            /**
             * Returns the current page number as if numbering starts on page one, regardless of the indexing of the
             * underlying server API.
             */
            currentOneIndexPage: function () {
                return this.currentPage + (this.isZeroIndexed ? 1 : 0);
            },

            /**
             * Sets the current page of the collection. Page is assumed to be one indexed, regardless of the indexing
             * of the underlying server API.
             * @param page one-indexed page to change to
             */
            setPage: function (page) {
                var oldPage = this.currentPage,
                    self = this;
                this.goTo(page - (this.isZeroIndexed ? 1 : 0), {
                    reset: true,
                    success: function () {
                        self.trigger('page_changed');
                    },
                    error: function () {
                        self.currentPage = oldPage;
                    }
                });
            },

            /**
             * Returns true if the collection has a next page, false otherwise.
             */
            hasNextPage: function () {
                return this.currentOneIndexPage() + 1 <= this.totalPages;
            },

            /**
             * Returns true if the collection has a previous page, false otherwise.
             */
            hasPreviousPage: function () {
                return this.currentOneIndexPage() - 1 >= 1;
            },

            /**
             * Moves the collection to the next page, if it exists.
             */
            nextPage: function () {
                if (this.hasNextPage()) {
                    this.setPage(this.currentOneIndexPage() + 1);
                }
            },

            /**
             * Moves the collection to the previous page, if it exists.
             */
            previousPage: function () {
                if (this.hasPreviousPage()) {
                    this.setPage(this.currentOneIndexPage() - 1);
                }
            },

            /**
             * Adds the given field to the list of fields that can be sorted on.
             * @param fieldName name of the field for the server API
             * @param displayName name of the field to display to the user
             */
            registerSortableField: function (fieldName, displayName) {
                this.addField(this.sortableFields, fieldName, displayName);
            },

            /**
             * Adds the given field to the list of fields that can be filtered on.
             * @param fieldName name of the field for the server API
             * @param displayName name of the field to display to the user
             */
            registerFilterableField: function (fieldName, displayName) {
                this.addField(this.filterableFields, fieldName, displayName);
            },

            /**
             * For internal use only. Adds the given field to the given collection of fields.
             * @param fields object of existing fields
             * @param fieldName name of the field for the server API
             * @param displayName name of the field to display to the user
             */
            addField: function (fields, fieldName, displayName) {
                fields[fieldName] = {
                    displayName: displayName
                };
            },

            /**
             * Returns the display name of the field that the collection is currently sorted on.
             */
            sortDisplayName: function () {
                return this.sortableFields[this.sortField].displayName;
            },

            /**
             * Returns the display name of the field that the collection is currently filtered on.
             */
            filterDisplayName: function () {
                return this.filterableFields[this.filterField].displayName;
            },

            /**
             * Sets the field to sort on.
             * @param fieldName name of the field to sort on
             * @param toggleDirection if true, the sort direction is toggled if the given field was already set
             */
            setSortField: function (fieldName, toggleDirection) {
                if (toggleDirection) {
                    if (this.sortField === fieldName) {
                        this.sortDirection = PagingCollection.SortDirection.flip(this.sortDirection);
                    } else {
                        this.sortDirection = PagingCollection.SortDirection.DESCENDING;
                    }
                }
                this.sortField = fieldName;
                this.setPage(1);
            },

            /**
             * Sets the direction of the sort.
             * @param direction either ASCENDING or DESCENDING from PagingCollection.SortDirection.
             */
            setSortDirection: function (direction) {
                this.sortDirection = direction;
                this.setPage(1);
            },

            /**
             * Sets the field to filter on.
             * @param fieldName name of the field to filter on
             */
            setFilterField: function (fieldName) {
                this.filterField = fieldName;
                this.setPage(1);
            }
        }, {
            SortDirection: {
                ASCENDING: 'ascending',
                DESCENDING: 'descending',
                flip: function (direction) {
                    return direction == this.ASCENDING ? this.DESCENDING : this.ASCENDING;
                }
            }
        });
        return PagingCollection;
    });
}).call(this, define || RequireJS.define);
