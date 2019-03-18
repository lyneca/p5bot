#!/bin/bash

# id="render$(date +%s%N)"
id=$1

cp index.html p5.min.js /tmp/$id/

echo "Rendering with PhantomJS..."
bin/phantomjs render.js $id

echo "Stitching frames to gif..."
convert -loop 0 -delay 4 /tmp/$id/frames/* /tmp/$id/render.gif

echo "Done."
mkdir -p /tmp/renders
cp /tmp/$id/render.gif /tmp/renders/$id.gif
rm -rf /tmp/$id
