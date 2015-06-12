"""
Settings for building static assets for Bok Choy tests.
"""

import os
from path import path

# Pylint gets confused by path.py instances, which report themselves as class
# objects. As a result, pylint applies the wrong regex in validating names,
# and throws spurious errors. Therefore, we disable invalid-name checking.
# pylint: disable=invalid-name


########################## Prod-like settings ###################################
# These should be as close as possible to the settings we use in production.
# As in prod, we read in environment and auth variables from JSON files.
# Unlike in prod, we use the JSON files stored in this repo.
# This is a convenience for ensuring (a) that we can consistently find the files
# and (b) that the files are the same in Jenkins as in local dev.
os.environ['SERVICE_VARIANT'] = 'bok_choy'
os.environ['CONFIG_ROOT'] = path(__file__).abspath().dirname()  # pylint: disable=no-value-for-parameter

from .aws import *  # pylint: disable=wildcard-import, unused-wildcard-import

######################### Testing overrides ####################################

# Redirect to the test_root folder within the repo
TEST_ROOT = CONFIG_ROOT.dirname().dirname() / "test_root"  # pylint: disable=no-value-for-parameter
LOG_DIR = (TEST_ROOT / "log").abspath()

# Switch off debug so that the pipeline will generate optimized files
DEBUG = False

# Store the static files under test root so that they don't overwrite existing static assets
STATIC_ROOT = (TEST_ROOT / "staticfiles").abspath()

# Points to a RequireJS build configuration that disables Uglify for two reasons
# 1. Uglify is by far the slowest part of the build process
# 2. Having full source code makes debugging tests easier for developers
REQUIRE_BUILD_PROFILE = "build-debug.js"
