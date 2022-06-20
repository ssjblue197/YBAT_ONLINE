<template>
  <div id="app">
    <!-- Menu -->
    <div class="col-2 mr-3">
      <div class="row">
        <img
          src="./assets/logo.png"
          style="height: 120px; width: 140px;"
        />
      </div>
      <div class="row">
        <b-input-group prepend="Search" class="mt-3">
          <b-form-input disabled></b-form-input>
          <!-- <b-input-group-append>
            <b-button variant="info">Search</b-button>
          </b-input-group-append> -->
        </b-input-group>
      </div>
      <hr>
      <div class="row">
        <h5>
          Images List
        </h5>
      </div>
      <div class="col mt-1" style="height: 200px; background-color: white; overflow-y: scroll; overflow-x: hidden;"
      >
        <b-list-group>
          <b-list-group-item
            class="imageItem"
            :style="imageSelected === item[1] ? 'background-color: lime;' : ''"
            v-for="(item, index) in imagesList" :key="index"
            @click="selectImage(item)"
          >
            {{ item[1] }}
          </b-list-group-item>
        </b-list-group>
      </div>
      <hr>
      <div class="row">
        <div class="file-input">
          <div class="col">
            <input type="file" id="files" class="file" ref="files" v-on:change="handleFileUpload()"/>
            <label for="files">Select file
              <p class="file-name"></p>
            </label>
          </div>
        </div>
        <div class="text-h6" v-if="this.files.length > 0" style="padding: 10px; left: 30px;">
            Selected: {{ this.files.length }} files.
        </div>
      </div>
      <hr>
      <div class="row" style="height: 200px; background-color: white; overflow-y: scroll; overflow-x: hidden;">
        <b-list-group>
          <b-list-group-item
            class="imageItem"
            v-for="(item, index) in classList" :key="index"
            v-if="item !== ''"
            :style="classSelected === item ? 'background-color: lime;' : ''"
            @click="selectClass(item)"
          >
            {{ item }}
          </b-list-group-item>
        </b-list-group>
      </div>
      <hr>
      <div class="row">
        <b-button variant="success" class="button" @click="saveJob">Save</b-button>
      </div>
    </div>

    <!-- Content -->
    <div class="col" style="width: 80%; display: flex;
      justify-content: center;
      text-align: center;
      justify-items: center;
      margin-left: 20px;
      background-color: gray;
    ">
      <mainView
        :dataImg="imageObj"
        :classSelected="classSelected"
        @previousImage="previousImage"
        @nextImage="nextImage"
      />
    </div>
  </div>
</template>

<script>
import { API_CONFIG } from './apiConfig';
import axios from 'axios';
import mainView from './mainView.vue';
import 'regenerator-runtime/runtime';

var JSZip = require('jszip');
import { saveAs } from 'file-saver';
export default {
  components: {
    mainView
  },
  name: 'app',
  created() {
    axios.get(API_CONFIG.BASE_URL + 'checkfolder').then((response) => {
      this.imagesList = JSON.parse(response.data)[1].files;
      console.log(this.imagesList);
    })
  },
  beforeDestroy() {
    localStorage.removeItem('oldDataDraw');
  },
  data () {
    return {
      files: [],
      imageSearch: '',
      imagesList: [],
      imageObj: {},
      fileClass: null,
      classList: [],
      classSelected: '',
      imageSelected: ''
    }
  },
  methods: {
    async saveJob(){
      var zip = new JSZip();
      console.log(zip);
      let oldDataDraw = localStorage.getItem('oldDataDraw');
      console.log(JSON.parse(oldDataDraw));
      const allData = JSON.parse(oldDataDraw);
      for (const imageObj of allData) {
        console.log(imageObj);
        const ImageContent = [];
        for (const box of imageObj.data) {
          const boxContent = [];
          boxContent.push(this.classList.indexOf(box.name));
          boxContent.push((box.data[0][0] + box.data[1][0]) / (2 * imageObj.width));
          boxContent.push((box.data[0][1] + box.data[1][1]) / (2 * imageObj.height));
          boxContent.push(Math.abs(box.data[0][0] - box.data[1][0]) / (imageObj.width));
          boxContent.push(Math.abs(box.data[0][1] - box.data[1][1]) / (imageObj.height));
          ImageContent.push(boxContent.join(' '));
        }
        console.log(ImageContent);
        zip.file((imageObj.name.split('.'))[0] + '.txt', ImageContent.join('\n'));
      }
      zip.generateAsync({
        type: 'blob'
      }).then((blob) => {
        saveAs(blob, `YBat${Date.now()}.zip`);
      })
    },
    selectClass(item) {
      this.classSelected = item;
    },
    async nextImage() {
      let currentIndex = -1;
      for (let i = 0; i < this.imagesList.length; i++) {
        if (this.imagesList[i][1] === this.imageSelected) {
          currentIndex = i;
        }
      }
      if (currentIndex < 0) return;
      if (currentIndex > this.imagesList.length - 1) return;
      if (currentIndex >= 0 && currentIndex < this.imagesList.length - 1) {
        await this.selectImage(this.imagesList[currentIndex + 1]);
      }
    },
    async previousImage() {
      let currentIndex = -1;
      for (let i = 0; i < this.imagesList.length; i++) {
        if (this.imagesList[i][1] === this.imageSelected) {
          currentIndex = i;
        }
      }
      if (currentIndex <= 0) return;
      if (currentIndex > this.imagesList.length - 1) return;
      if (currentIndex > 0 && currentIndex <= this.imagesList.length - 1) {
        await this.selectImage(this.imagesList[currentIndex - 1]);
      }
    },
    async selectImage(item) {
      console.log('[ITEM]', item);
      this.imageSelected = item[1];
      try {
        const resData = await axios.post(API_CONFIG.BASE_URL + `imageb64?name_folder=12&image=${item[1]}`);
        if (resData.status === 200) {
          this.imageObj = {
            ...resData.data,
            name: this.imageSelected
          };
        }
      } catch (error) {
        this.imageObj = {};
      }
    },
    handleFileUpload(){
      if (this.$refs.files.files[0].type === 'text/plain') {
        this.$toaster.success('Import successfully');
        this.files = this.$refs.files.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          this.classList = reader.result.split('\n');
          console.log(this.classList);
        }
        reader.readAsText(this.files);
      } else {
        this.$toaster.info('Only upload file with extension: ".txt"');
      }
      console.log(this.$refs.files.files);
    },
  }
}
</script>

<style>
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

.row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  text-align: center;
}

.col {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  justify-content: start;
}

.button {
  width: 120px;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: start;
  text-align: center;
  height: 100vh;
  padding-left: 20px;
}
.imageItem {
  text-overflow: ellipsis;
}

.imageItem:hover {
  background-color: orange;
}

h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}


</style>
