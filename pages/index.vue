<template>
  <main class="app">
    <h1>The secret project</h1>

    <div class="main">
      <div class="selector">
        <div
          v-on:click="select('create')"
          :class="{ selected: createSelected }"
        >
          <p>Create</p>
        </div>
        <div v-on:click="select('peek')" :class="{ selected: peekSelected }">
          <p>Peek</p>
        </div>
      </div>

      <div class="content">
        <div v-if="createSelected" class="create flex-column-centered">
          <input
            type="text"
            class="form-input"
            v-model="newSecret"
            placeholder="secret"
            :class="{ 'form-error': formErrors['newSecret'] }"
          />
          <input
            type="number"
            class="form-input top-margin"
            v-model="newExpireAfterViews"
            placeholder="expire after (views)"
            :class="{ 'form-error': formErrors['newExpireAfterViews'] }"
          />
          <input
            type="number"
            class="form-input top-margin"
            v-model="newExpireAfter"
            placeholder="expire after (minutes)"
            :class="{ 'form-error': formErrors['newExpireAfter'] }"
          />
          <input
            type="button"
            value="Create"
            class="form-input-btn"
            v-on:click="create"
          />
        </div>

        <div v-if="peekSelected" class="peek flex-column-centered">
          <input
            type="text"
            class="form-input"
            v-model="hash"
            placeholder="secret's hash"
            :class="{ 'form-error': formErrors['hash'] }"
          />
          <div v-if="isLoading">
            <input
              type="button"
              class="form-input-btn"
              value="Loading"
              disabled
            />
          </div>
          <div v-else>
            <input
              v-on:click="peek"
              type="button"
              class="form-input-btn"
              value="Peek"
            />
          </div>

          <div v-if="secret">
            <p>Hash:</p>
            <span>{{ secret.hash }}</span>
            <p>Secret:</p>
            <span>{{ secret.secretText }}</span>
            <p>Created at:</p>
            <span>{{ secret.createdAt }}</span>
            <p>Expires at:</p>
            <span>{{ secret.expiresAt }}</span>
            <p>Remaining views:</p>
            <span>{{ secret.remainingViews }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showMessage" class="message" :class="{ 'appear-disappear': showMessage }">
      {{ message }}
    </div>
  </main>
</template>

<script>
export default {
  name: "IndexPage",

  methods: {
    select(option) {
      this.createSelected = option === "create";
      this.peekSelected = option === "peek";
      this.secret = null;
      this.hash = null;
    },
    create() {
      if (!this.validateForm("create")) return;

      fetch("http://localhost:3000/api/secret", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secretText: this.newSecret,
          expireAfterViews: this.newExpireAfterViews,
          expireAfter: this.newExpireAfter,
        }),
      })
        .then((res) => res.json())
        .then((data) => this.setMessage(data.hash));

      this.newSecret = "";
      this.newExpireAfterViews = "";
      this.newExpireAfter = "";
    },
    peek() {
      const RESPONSE_STATUS = {
        "ERROR": -1,
        "NO_SECRET_WITH_THIS_HASH_FOUND": 0,
        "NO_MORE_VIEWS_ON_SECRET": 1,
        "SECRET_EXPIRED": 2,
        "SECRET_FOUND": 3,
      };

      const RESPONSE_STATUS_TO_MESSAGE = {
        [RESPONSE_STATUS.ERROR]: 'An unexpected error happened',
        [RESPONSE_STATUS.NO_SECRET_WITH_THIS_HASH_FOUND]: 'No secret with this hash found',
        [RESPONSE_STATUS.NO_MORE_VIEWS_ON_SECRET]: 'No more views on secret',
        [RESPONSE_STATUS.SECRET_EXPIRED]: 'Secret expired',
      }

      if (!this.validateForm("peek")) return;

      this.isLoading = true;
      fetch(`http://localhost:3000/api/secret/${this.hash}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status != RESPONSE_STATUS.SECRET_FOUND) {
            this.secret = null
            this.setMessage(RESPONSE_STATUS_TO_MESSAGE[data.status])

          }else{
            this.secret = data.secret
          }

          this.isLoading = false;
        });
    },
    validateForm(type) {
      const { newSecret, newExpireAfterViews, newExpireAfter, hash } = this;

      if (type === "create") {
        this.formErrors = {
          newSecret: !newSecret,
          newExpireAfterViews: !newExpireAfterViews,
          newExpireAfter: !newExpireAfter,
        };

        if (!newSecret || !newExpireAfterViews || !newExpireAfter) {
          return false;
        }
      } else if (type === "peek") {
        this.formErrors = {
          hash: !hash,
        };

        return !!hash;
      }

      return true;
    },
    setMessage(message) {
      this.message = message;
      this.showMessage = true;
      setTimeout(() => {
        this.showMessage = false;
      }, 3400);
    },
  },

  data() {
    return {
      isLoading: false,
      secret: null,

      createSelected: true,
      peekSelected: false,

      newSecret: "",
      newExpireAfterViews: "",
      newExpireAfter: "",

      hash: "",

      message: "",
      showMessage: false,

      formErrors: {
        newSecret: false,
        newExpireAfterViews: false,
        newExpireAfter: false,
        hash: false,
      },
    };
  },
};
</script>
