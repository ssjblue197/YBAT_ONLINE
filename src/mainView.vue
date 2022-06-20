<template>
    <div class="mainView">
        <div class="liveview-player">
            <img 
                v-if="selectedImage !== ''"
                :src="selectedImage"
                :style="`width: ${this.width}px; height: ${this.height}px;`"
                class="imageView"
            />
            <div v-else style="height: 600px; padding-top: 30vh;">
                No selected image
            </div>
            <input type="text" id="bseudo" @keyup.delete="deleteBox(selectedBox)"
                @keyup.right="nextImage"
                @keyup.left="previousImage"
            />
            <div class="canvasObject"
            >
                <v-stage
                    ref="stage"
                    @click="onStageClick"
                    @mouseup="pointEnd"
                    @mousemove="pointHover"
                    @mousedown="pointStart"
                    :config="configKonva"
                >
                    <v-layer>
                        <v-image :config="{ image: image, width: 1200, height: 900 }" />
                        <v-rect 
                          ref="area"
                          v-if="box.length == 2"
                          :config="{
                            x: box[0][0],
                            y: box[0][1],
                            width: box[1][0] - box[0][0],
                            height: box[1][1] - box[0][1],
                            fill: 'orange',
                            strokeWidth: 1,
                            stroke: 'black',
                            opacity: 0.4,
                            }"
                        />
                        <v-rect 
                          ref="area"
                          v-if="selectedBox.length == 2"
                          :config="{
                            x: selectedBox[0][0],
                            y: selectedBox[0][1],
                            width: selectedBox[1][0] - selectedBox[0][0],
                            height: selectedBox[1][1] - selectedBox[0][1],
                            fill: 'blue',
                            strokeWidth: 1,
                            stroke: 'black',
                            opacity: 0.4,
                            }"
                        />
                        <v-line
                            v-if="currentPosition.length > 0 && selectedImage !== ''"
                            ref="lineHorizon"
                            :config="{
                            x: 0,
                            y: 0,
                            points: [0, currentPosition[1], 1200, currentPosition[1]],
                            stroke: 'black',
                            strokeWidth: 1,
                        }"/>
                        <v-line
                            v-if="currentPosition.length > 0 && selectedImage !== ''"
                            ref="lineVertical"
                            :config="{
                            x: 0,
                            y: 0,
                            points: [currentPosition[0], 0, currentPosition[0], 900],
                            stroke: 'black',
                            strokeWidth: 1,
                        }"/>
                        <v-rect
                            @click="selectedBoxRegion(item)"
                          v-for="(item, index) in boxList"
                          :key="index"
                          :config="{
                            x: item.data[0][0],
                            y: item.data[0][1],
                            width: item.data[1][0] - item.data[0][0],
                            height: item.data[1][1] - item.data[0][1],
                            fill: 'lime',
                            stroke: 'black',
                            strokeWidth: 1,
                            opacity: 0.4,
                            }"
                        />
                        <v-text
                            v-for="item in boxList"
                            :key="item.id"
                            :config="{
                                x: Math.min(item.data[0][0], item.data[1][0]),
                                y: Math.min(item.data[0][1], item.data[1][1]),
                                text: item.name,
                                fontSize: 20,
                                fill: 'red'
                            }"
                        />
                    </v-layer>
                </v-stage>
            </div>
        </div>
        <div class="toolsMenu">
            <b-button class="toolButton">
                <b-icon icon="arrow-clockwise" class="iconMenu" font-scale="2" @click="revertRegion()"></b-icon>
            </b-button>
            <!-- <b-button class="toolButton">
                <b-icon icon="eraser-fill" class="iconMenu" font-scale="2"></b-icon>
            </b-button> -->
        </div>
        <!-- <div class="drawRegion">
        </div> -->
    </div>
</template>

<script>
export default {
    props: ['dataImg', 'classSelected'],
    data () {
        return {
            configKonva: {
                width: 1200,
                height: 900
            },
            image: new window.Image(),
            width: null,
            height: null,
            selectedImage: '',
            startPoint: [],
            endPoint: [],
            boxList: [],
            box: [],
            selectedBox: [],
            isMouseDown: false,
            currentPosition: [],
            focusInterval: null,
        }
    },
    watch: {
        dataImg: function () {
            this.selectedImage = '';
            this.box = [];
            this.boxList = [];
            this.startPoint = [];
            this.endPoint = [];
            this.selectedBox = [];
            this.currentPosition = [];
            if (!!this.dataImg.data) {
                this.configKonva.width = this.dataImg.width;
                this.configKonva.height = this.dataImg.height;
                this.selectedImage = 'data:image/jpg;base64, ' + this.dataImg.data;
                this.restoreDataDraw(this.dataImg.name);
            }
        },
    },
    mounted: function() {
        this.image.onload = () => {
                this.width = this.image.width;
                this.height = this.image.height;
                // for (const region in this.form.regions) {
                //     for (const point in this.form.regions[region]) {
                //         const x = this.form.regions[region][point][0];
                //         const y = this.form.regions[region][point][1];
                //         this.form.regions[region][point][0] = Math.round((x * 766) / this.width);
                //         this.form.regions[region][point][1] = Math.round((y * 430) / this.height);
                //     }
                // }
            };
            this.image.onerror = () => {
                console.log('[IMAGE ERROR]');
            };
    },
    created() {
        this.focusInterval = setInterval(() => {
            document.querySelector('#bseudo').focus();
        }, 500);
    },
    beforeDestroy() {
        if (this.focusInterval) {
            clearInterval(this.focusInterval);
            this.focusInterval = null;
        }
        localStorage.removeItem('oldDataDraw');
    },
    methods: {
        overCanvas() {
            if (this.isMouseDown) {
                this.pointEnd();
            }
        },
        nextImage() {
            this.$emit('nextImage');
        },
        previousImage() {
            this.$emit('previousImage');
        },
        revertRegion() {
            this.boxList.pop();
        },
        isDuplicatePoint(point1, point2) {
            if (point1[0] === point2[0] && point1[1] === point2[1]) {
                return true;
            }
            return false
        },
        deleteBox(item) {
            if (this.boxList.length > 0) {
                const tmpArray = this.boxList.filter(box => !this.isDuplicatePoint(item[0], box.data[0]) || !this.isDuplicatePoint(item[1], box.data[1]))
                this.boxList = tmpArray;
                this.selectedBox = [];
                this.backupDataDraw(this.dataImg, this.boxList);
            }
        },
        selectedBoxRegion(data) {
            console.log('[DATA]', data);
            if (this.selectedBox.length > 0) {
                if (this.selectedBox[0] === data.data[0] && this.selectedBox[1] === data.data[1]) {
                    this.selectedBox = [];
                } else {
                    this.selectedBox = data.data;
                }
            } else {
                this.selectedBox = data.data;
            }
            document.querySelector('#bseudo').focus();
        },
        pointHover(index) {
            if (this.selectedImage) {
                const mousePos = this.$refs.stage.getStage().getPointerPosition();
                // console.log(mousePos);
                this.currentPosition = [mousePos.x, mousePos.y];
                if (this.isMouseDown && this.selectedImage) {
                    // console.log(mousePos);
                    this.endPoint = [mousePos.x, mousePos.y];
                    if (this.box.length <= 1) {
                        this.box.push([mousePos.x, mousePos.y]);
                    } else {
                        this.box[1] = [mousePos.x, mousePos.y];
                        this.$refs['area'].getNode().setAttrs({
                            width: mousePos.x - this.startPoint[0],
                            height: mousePos.y - this.startPoint[1]
                        });
                        this.$refs['area']
                        .getNode()
                        .getLayer()
                        .batchDraw();
                    }
                }
            }
        },
        onStageClick(event) {
            const mousePos = this.$refs.stage.getStage().getPointerPosition();
            // console.log(mousePos);
            // if (
            //     this.drawing &&
            //     this.calcDistance([mousePos.x, mousePos.y], this.item.points[0]) < 100
            // ) {
            //     this.draw();
            // } else {
            //     this.item.points.push([mousePos.x, mousePos.y]);
            //     this.drawingPoint.push([mousePos.x, mousePos.y]);
            // }
        },
        calcDistance(point1, point2) {
            return (
                (point1[0] - point2[0]) * (point1[0] - point2[0]) +
                (point1[1] - point2[1]) * (point1[1] - point2[1])
            );
        },
        pointStart () {
            if (this.selectedImage) {
                this.isMouseDown = true;
                this.startPoint = [];
                this.box = [];
                const mousePos = this.$refs.stage.getStage().getPointerPosition();
                this.startPoint.push(mousePos.x);
                this.startPoint.push(mousePos.y);
                this.box.push(this.startPoint);
            }
        },
        randomID() {
            return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        },
        pointEnd() {
            if (this.selectedImage) {
                this.endPoint = [];
                const mousePos = this.$refs.stage.getStage().getPointerPosition();
                if (this.classSelected !== '') {
                    if (this.calcDistance([mousePos.x, mousePos.y], this.startPoint) < 100) {
                        this.startPoint = [];
                        this.endPoint = [];
                    } else {
                        this.endPoint = [mousePos.x, mousePos.y];
                        if (this.box.length <= 1) {
                            this.box.push([mousePos.x, mousePos.y]);
                        } else {
                            this.box[1] = [mousePos.x, mousePos.y];
                        }
                        console.log("Start", this.startPoint);
                        console.log("End", this.endPoint);
                        const objBox = {
                            data: this.box,
                            name: this.classSelected,
                            id: this.randomID()
                        }
                        this.boxList.push(objBox);
                        this.backupDataDraw(this.dataImg, this.boxList);
                    }
                } else {
                    this.$toaster.warning('Not yet select class');
                }
                this.box = [];
                this.isMouseDown = false;
            }
        },
        backupDataDraw(dataImg, data) {
            console.log(dataImg);
            let oldDataDraw = localStorage.getItem('oldDataDraw');
            if (oldDataDraw) {
                const tmpArr = JSON.parse(oldDataDraw);
                if (tmpArr.length > 0) {
                    let checkExist = false;
                    for (const item of tmpArr) {
                        if (item.name == dataImg.name) {
                            item.data = data;
                            checkExist = true;
                        }
                    }
                    if (!checkExist) {
                        tmpArr.push({
                            name: dataImg.name,
                            data: data,
                            width: dataImg.width,
                            height: dataImg.height
                        });
                    }
                } else {
                    tmpArr.push({
                        name: dataImg.name,
                        data: data,
                        width: dataImg.width,
                        height: dataImg.height
                    });
                }
                localStorage.setItem('oldDataDraw', JSON.stringify(tmpArr));
                console.log('[BACKUP]', tmpArr);
            } else {
                const storeData = [];
                storeData.push({
                    name: dataImg.name,
                    data: data,
                    width: dataImg.width,
                    height: dataImg.height
                });
                localStorage.setItem('oldDataDraw', JSON.stringify(storeData));
            }
        },
        restoreDataDraw(name) {
            let oldDataDraw = localStorage.getItem('oldDataDraw');
            console.log(name, JSON.parse(oldDataDraw));
            if (oldDataDraw) {
                const tmpArr = JSON.parse(oldDataDraw);
                for (const item of tmpArr) {
                    if (item.name === name) {
                        this.boxList = item.data;
                    }
                }
            }
        }
    }
}
</script>

<style scoped>
.mainView {
    
}

.canvasObject {
    position: absolute;
    overflow: hidden;
    z-index: 800;
    top: 0px;
    left: 0;
    bottom: 0;
    right: 0;
    /* background-color: rgba(255, 162, 63, 0.5); */
    display: flex;
    flex-direction: row;
    justify-content: center;
    justify-items: center;
    text-align: center;
}
.liveview-player {
    position: relative;
    display: block;
    z-index: 700;
}
.imageView {
    box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
    border: 1px solid black;
}
.toolsMenu {
    position: absolute;
    top: 0px;
    right: 0px;
    width: 60px;
    height: 400px;
    box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
    border-radius: 0px 0px 0px 8px;
    background-color: rgba(224, 208, 208, 0.2);
    z-index: 801;
    display: flex;
    flex-direction: column;
    justify-content: start;
    text-align: center;
    justify-items: center;
}
#bseudo {
    position: absolute;
    top: 0px;
    left: 0px;
    background-color: transparent;
    outline: none;
    border: none;
    color: transparent;
}
.iconMenu {
    width: 100%; 
    margin: 0;
}
.iconMenu:hover {
    /* background-color: rgba(255, 162, 63, 0.5); */
}
.iconMenu:active {
    /* background-color: lime; */
}
.toolButton{
    padding: 0;
    margin: 10px;
}
.toolButton:active {
     background-color: lime;
}

</style>