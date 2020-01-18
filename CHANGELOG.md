# Change Log
This project adheres to [Semantic Versioning](http://semver.org/).

## 0.6
* Do not spend resources to deploy website if files were not changed.
* Fix colors on GitHub Actions.

## 0.5.1
* Fix `trim()` error on default region environment variable.

## 0.5
* Add `npm` support.
* Add `--verbose` by default to deploy workflow.
* Fix error on new line and spaces in environment variables.

## 0.4.2
* Fix deploy without previous images to clean.

## 0.4.1
* Show step number during the build.

## 0.4
* Rename `node_modules/ssdeploy/purge` to `node_modules/ssdeploy/purge.js`.
* Move configs to `node_modules/ssdeploy/configs`.

## 0.3.1
* Fix cleaned images count.

## 0.3
* Show the size of the image after build.

## 0.2.4
* Fix first deploy.
* Fix deploy on local laptop.

## 0.2.3
* Clean up GitHub Actions workflow.

## 0.2.2
* Add `--verbose` support to `ssdeploy run` and `ssdeploy shell`.

## 0.2.1
* Do not open browser on `ssdeploy shell`.

## 0.2
* Rename project from `solid-state-deploy` to `ssdeploy`.
* Add `shell` command.

## 0.1
* Initial release.
