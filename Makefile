npm_host_run: ## npm run with host
	npm run dev -- --host

build_android: ## build static files
	npm run build:mobile

setup_android: ## set up android for usb debug
	# npx cap run android --list
	npx cap run android

assembleDebug: ## assembleRelease for apk debug
	make build_android
	cd ./android && ./gradlew assembleDebug && cd ..

assembleRelease: ## assembleRelease for apk release
	make build_android
	cd android && ./gradlew clean assembleRelease && cd ..

bundleRelease: ## build release aab
	make build_android
	cd android && ./gradlew clean bundleRelease && cd ..

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | \
	awk 'BEGIN {FS = ":.*?## "}; {printf "%-20s %s\n", $$1, $$2}'
