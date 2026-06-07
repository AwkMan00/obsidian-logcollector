#!/bin/bash

VERSION="3.0.2"

#Get script path
SCRIPTPATH="$(dirname $(realpath $0))"

#Change to script path
cd "$SCRIPTPATH"
if [[ $? -ne 0 ]]
then
	echo "Error changing to directory $SCRIPTPATH"
	exit 1
fi


#Go one level back where the repository is
cd ..
if [[ $? -ne 0 ]]
then
	echo "Error changing to directory $(dirname ${SCRIPTPATH})"
	exit 1
fi

#Replace building time and version in src/plugin-info.json and src/plugin-info.ts file
sed -i '/pluginReleasedAt/s/: ".*"/: "'$(date +"%Y-%02m-%02dT%02H:%02M:%02S%z")'"/' src/plugin-info.json src/plugin-info.ts
sed -i '/pluginVersion/s/: ".*"/: "'$VERSION'"/' src/plugin-info.json src/plugin-info.ts

#Replace version in manifest.json and package.json
sed -i '/"version":/s/: ".*"/: "'$VERSION'"/' manifest.json
sed -i '/"version":/s/: ".*"/: "'$VERSION'"/' package.json

#Check if current version is in versions.json file
grep -q "\"$VERSION\"" versions.json
if [[ $? -ne 0 ]]
then
	#Get obsidian version from package.json
	OBSIDIAN_VERSION=$(awk -v FS='"' '/"obsidian":/ {a=$(NF-1);gsub(/[^0-9\.]/,"",a);printf "%s",a;exit}' package.json)
	#Add new version in versions.json
	awk -v version="$VERSION" -v obsidian="$OBSIDIAN_VERSION" '$0~/"[[:space:]]{0,}$/ {print $0",\n  \""version"\": \""obsidian"\"";next} {print}' versions.json > tmp
	rm -f versions.json
	mv tmp versions.json
fi


#Build application
pnpm run build
if [[ $? -ne 0 ]]
then
	echo "Error building package"
	exit 1
fi

#Create zip package with distribution files and source code
rm -f dist/obsidian-logcollector*.zip dist/obsidian-logcollector*.tar.gz
7z a -mx=9 dist/obsidian-logcollector-src-${VERSION}.zip CHANGELOG.md esbuild.config.mjs .eslintrc LICENSE.md package.json README.md src versions.json data.json .editorconfig .eslintignore .gitignore manifest.json scripts tsconfig.json
tar -cvzf dist/obsidian-logcollector-src-${VERSION}.tar.gz CHANGELOG.md esbuild.config.mjs .eslintrc LICENSE.md package.json README.md src versions.json data.json .editorconfig .eslintignore .gitignore manifest.json scripts tsconfig.json

cd dist
7z a -mx=9 obsidian-logcollector-dist-${VERSION}.zip main.js manifest.json

