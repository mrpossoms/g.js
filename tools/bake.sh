#!/bin/sh
# Bakes a game into a single self contained .html file on stdout. The bundled
# script is inlined and every file in the assets directory is embedded as a
# base64 data: url.
#
# usage: tools/bake.sh <template.html> <bundle.js> <assets dir> <title> > game.html
#
# Assets are named by their path relative to the assets directory, e.g.
# assets/imgs/foo.png is loaded as 'imgs/foo.png' just like in `g dev`
set -e

template=$1
bundle_js=$2
assets_dir=$3
title=$4

mime() {
	case "$1" in
		*.json)       echo application/json ;;
		*.png)        echo image/png ;;
		*.jpg|*.jpeg) echo image/jpeg ;;
		*.gif)        echo image/gif ;;
		*.ogg)        echo audio/ogg ;;
		*.wav)        echo audio/wav ;;
		*.mp3)        echo audio/mpeg ;;
		*)            echo text/plain ;;
	esac
}

assets() {
	echo '<script>'
	echo 'const asset_list = {'
	if [ -d "$assets_dir" ]; then
		(cd "$assets_dir" && find . -type f ! -name '.*' | sed 's#^\./##' | sort) | while IFS= read -r f; do
			printf "\t'%s': 'data:%s;base64,%s',\n" "$f" "$(mime "$f")" "$(base64 < "$assets_dir/$f" | tr -d '\n')"
		done
	fi
	echo '};'
	echo '</script>'
}

script() {
	echo '<script>'
	# a literal '</script' inside inlined js would end the script element early
	sed 's#</script#<\\/script#g' "$bundle_js"
	echo '</script>'
}

while IFS= read -r line; do
	case "$line" in
		*'<!-- g:title -->'*) printf '%s\n' "$line" | sed "s#<!-- g:title -->#$title#" ;;
		*'<!-- g:head -->'*)  ;; # baked games are offline, no socket.io
		*'<!-- g:assets -->'*) assets ;;
		*'<!-- g:script -->'*) script ;;
		*) printf '%s\n' "$line" ;;
	esac
done < "$template"
