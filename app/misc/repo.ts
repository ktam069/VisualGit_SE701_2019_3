let Git = require("nodegit");
let $ = require('jQuery');
let repoFullPath;
let repoLocalPath;
let bname = {};
let branchCommit = [];
let remoteName = {};
let localBranches = [];
let readFile = require("fs-sync");
let checkFile = require("fs");
let repoCurrentBranch = "master";
let modal;
let span;
let contributors: [any] = [0];
let previousOpen;

function downloadRepository() {
  let fullLocalPath;
  // Full path is determined by either handwritten directory or selected by file browser
  if (document.getElementById("repoSave").value != null || document.getElementById("repoSave").value != "") {
    // if the user entered a file location to save to
    // set that as the path
    fullLocalPath = document.getElementById("repoSave").value;

  } else {

    fullLocalPath = document.getElementById("dirPickerSaveNew").files[0].path;
    console.log(repoFullPath)

  }

  let cloneURL = document.getElementById("repoClone").value;

  if (!cloneURL || cloneURL.length === 0) {
    updateModalText("Clone Failed - Empty URL Given");
    switchToAddRepositoryPanel();
  } else {
    downloadFunc(cloneURL, fullLocalPath);
  }
}

function downloadFunc(cloneURL, fullLocalPath) {
  console.log("Path of cloning repo: " + fullLocalPath);

  let progressDiv = document.getElementById("cloneProgressDiv");
  progressDiv.style.visibility = "visible";

  let options = {};

  options = {
    fetchOpts: {
      callbacks: {
        certificateCheck: function () {
          return 1;
        },
        credentials: function () {
          return Git.Cred.userpassPlaintextNew(getUsernameTemp(), getPasswordTemp());
        },
        transferProgress: function (data) {
          let bytesRatio = data.receivedObjects() / data.totalObjects();
          updateProgressBar(bytesRatio);
        }
      }
    }
  };

  console.log("cloning into " + fullLocalPath);
  let repository = Git.Clone.clone(cloneURL, fullLocalPath, options)
    .then(function (repository) {
        progressDiv.style.visibility = 'collapse';
        updateProgressBar(0);
        console.log("Repo successfully cloned");
        displayModal("Drawing graph, please wait");
        refreshAll(repository);
        updateModalText("Clone Successful, repository saved under: " + fullLocalPath);
        addCommand("git clone " + cloneURL + " " + fullLocalPath);
        repoFullPath = fullLocalPath;
        repoLocalPath = fullLocalPath;
        displayModal("Drawing graph, please wait");
        refreshAll(repository);
        switchToMainPanel();
      },
      function (err) {
        updateModalText("Clone Failed - " + err);
        console.log("repo.ts, line 64, failed to clone repo: " + err); // TODO show error on screen
        switchToAddRepositoryPanel();
      });
}

function updateProgressBar(ratio) {
  let progressBar = document.getElementById("cloneProgressBar");
  let percentage = Math.floor(ratio * 100) + "%";
  progressBar.style.width = percentage;
  progressBar.innerHTML = percentage;
}

function openRepository() {
  console.log("Open Repository")
  if(document.getElementById("dirPickerOpenLocal").value === previousOpen && previousOpen != undefined){
    return;
  }
  // Full path is determined by either handwritten directory or selected by file browser
  if (document.getElementById("repoOpen").value == null || document.getElementById("repoOpen").value == "") {
    let localPath = document.getElementById("dirPickerOpenLocal").files[0].webkitRelativePath;
    let fullLocalPath = document.getElementById("dirPickerOpenLocal").files[0].path;
    previousOpen = document.getElementById("dirPickerOpenLocal").value;
    document.getElementById("repoOpen").value = fullLocalPath;
    document.getElementById("repoOpen").text = fullLocalPath;
  } else {
    let localPath = document.getElementById("repoOpen").value;
    let fullLocalPath;
    if (checkFile.existsSync(localPath)) {
      fullLocalPath = localPath;
    } else {
      fullLocalPath = require("path").join(__dirname, localPath);
    }
  }

  console.log("Trying to open repository at " + fullLocalPath);
  displayModal("Opening Local Repository...");

  Git.Repository.open(fullLocalPath).then(function (repository) {
      repoFullPath = fullLocalPath;
      repoLocalPath = localPath;
      if (readFile.exists(repoFullPath + "/.git/MERGE_HEAD")) {
        let tid = readFile.read(repoFullPath + "/.git/MERGE_HEAD", null);
        console.log("current HEAD commit: " + tid);
      }
      //Reads the git config file and extracts info about the remote "origin" branch on GitHub
      if (readFile.exists(repoFullPath + "/.git/config")) {
        let gitConfigFileText = readFile.read(repoFullPath + "/.git/config", null);
        let searchString = "[remote \"origin\"]";

        gitConfigFileText = gitConfigFileText.substr(gitConfigFileText.indexOf(searchString) + searchString.length, gitConfigFileText.length);
        gitConfigFileText = gitConfigFileText.substr(0, gitConfigFileText.indexOf(".git"));

        let gitConfigFileSubstrings = gitConfigFileText.split('/');

        //If the remote branch was set up using ssh, separate the elements between colons"
        if (gitConfigFileSubstrings[0].indexOf("@") != -1) {
          gitConfigFileSubstrings[0] = gitConfigFileSubstrings[0].substring(gitConfigFileSubstrings[0].indexOf(":") + 1);
        }

        let repoOwner = gitConfigFileSubstrings[gitConfigFileSubstrings.length - 2]
        let repoName = gitConfigFileSubstrings[gitConfigFileSubstrings.length - 1]
        //If the user is signed in, an API call can performed
        if(!continuedWithoutSignIn){
          //Call to get all usernames
          $.ajax({
            url: "https://api.github.com/repos/" + repoOwner + "/" + repoName + "/contributors",
            type: "GET",
            beforeSend: function (xhr) {
              xhr.setRequestHeader('Authorization', make_base_auth(getUsername(), getPassword()));
            },
            headers: {
              'Accept': 'application/vnd.github.v3+json'
            },
            success: function (response) {

              for (var i = 0; i < response.length; i++) {
                //Store list of logins here.
                contributors[i] = {
                  "username": response[i].login,
                  "name": "",
                  "email": ""
                }
              }
              console.log("The contributors for this project are ", contributors)
            },
            error(xhr,status,error){
              console.log("The XML Http Request of the GitHub API call is: ", xhr);
              console.log("The status of the GitHub API call is: ", status);
              console.log("The error of the GitHub API call is: ", error);
            }
          })
        }

    }
    displayModal("Drawing graph, please wait");
    refreshAll(repository);
    console.log("Repo successfully opened");
    updateModalText("Repository successfully opened");
  },
  function(err) {
    updateModalText("No repository found. Select a folder with a repository.");
    console.log("repo.ts, line 101, cannot open repository: "+err); // TODO show error on screen
    switchToAddRepositoryPanel();
  });
  document.getElementById("dirPickerOpenLocal").value = "";
}

function createLocalRepository() {
  //console.log("createLocalRepo")
  if (document.getElementById("repoCreate").value == null || document.getElementById("repoCreate").value == "") {
    document.getElementById("dirPickerCreateLocal").click();
    let localPath = document.getElementById("dirPickerCreateLocal").files[0].webkitRelativePath;
    let fullLocalPath = document.getElementById("dirPickerCreateLocal").files[0].path;
    document.getElementById("repoCreate").value = fullLocalPath;
    document.getElementById("repoCreate").text = fullLocalPath;
  } else {
    let localPath = document.getElementById("repoCreate").value;
    let fullLocalPath;
    if (!require('path').isAbsolute(localPath)) {
      updateModalText('The filepath is not valid. For OSX and Ubuntu the filepath should start with /, for Windows C:\\\\')
      return
    } else {
      if (checkFile.existsSync(localPath)) {
        fullLocalPath = localPath;
      } else {
        checkFile.mkdirSync(localPath);
        fullLocalPath = localPath;
      }
    }
  }

  //console.log("pre-git check")
  //console.log("fullLocalPath is " + fullLocalPath)
  //console.log(require("path").join(fullLocalPath,".git"));
  if (checkFile.existsSync(require("path").join(fullLocalPath, ".git"))) {
    //console.log("Is git repository already")
    updateModalText("This folder is already a git repository. Please try to open it instead.");
  } else {
    displayModal("creating repository at " + require("path").join(fullLocalPath, ".git"));
    Git.Repository.init(fullLocalPath, 0).then(function (repository) {
        repoFullPath = fullLocalPath;
        repoLocalPath = localPath;
        refreshAll(repository);
        //console.log("Repo successfully created");
        updateModalText("Repository successfully created");
        document.getElementById("repoCreate").value = "";
        document.getElementById("dirPickerCreateLocal").value = null;
        switchToMainPanel();
      },
      function (err) {
        updateModalText("Creating Failed - " + err);
        //console.log("repo.ts, line 131, cannot open repository: "+err); // TODO show error on screen
      });
  }
}

function addBranchestoNode(thisB: string) {
  let elem = document.getElementById("otherBranches");
  elem.innerHTML = '';
  for (let i = 0; i < localBranches.length; i++) {
    if (localBranches[i] !== thisB) {
      console.log("local branch: " + localBranches[i]);
      let li = document.createElement("li");
      let a = document.createElement("a");
      a.appendChild(document.createTextNode(localBranches[i]));
      a.setAttribute("tabindex", "0");
      a.setAttribute("href", "#");
      li.appendChild(a);
      elem.appendChild(li);
    }
  }
}

function refreshAll(repository) {
  displayModal("Drawing graph, please wait");
  let branch;
  bname = [];
  //Get the current branch from the repo
  repository.getCurrentBranch()
    .then(function (reference) {
      //Get the simplified name from the branch
      let branchParts = reference.name().split("/");
      console.log("branch parts: " + branchParts);
      branch = branchParts[branchParts.length - 1];
    })
    .then(function () {
      //Get the list of branches from the repo
      return repository.getReferences(Git.Reference.TYPE.LISTALL);
    })
    .then(function (branchList) {
      let count = 0;
      clearBranchElement();
      //for each branch
      for (let i = 0; i < branchList.length; i++) {
        console.log("branch name: " + branchList[i].name());
        //get simplified name
        let bp = branchList[i].name().split("/")[branchList[i].name().split("/").length - 1];

        Git.Reference.nameToId(repository, branchList[i].name()).then(function (oid) {
          // Use oid
          console.log("old id " + oid);
          if (branchList[i].isRemote()) {
            // for remote branches add oid and branch name to remote branches map
            remoteName[bp] = oid;
          } else {
            //add branch name to the branch list
            branchCommit.push(branchList[i]);
            console.log(bp + " adding to end of " + oid.tostrS());
            if (oid.tostrS() in bname) {
              bname[oid.tostrS()].push(branchList[i]);
            } else {
              bname[oid.tostrS()] = [branchList[i]];
            }
          }
        }, function (err) {
          console.log("repo.ts, line 273, could not find referenced branch" + err);
        });
        if (branchList[i].isRemote()) {
          if (localBranches.indexOf(bp) < 0) {
            displayBranch(bp, "branch-dropdown", "checkoutRemoteBranch(this)");
          }
        } else {
          localBranches.push(bp);
          displayBranch(bp, "branch-dropdown", "checkoutLocalBranch(this)");
        }

      }
    })
    .then(function () {
      console.log("Updating the graph and the labels");
      drawGraph();
      let breakStringFrom;
      if(repoLocalPath.length > 20){
        for(var i = 0; i < repoLocalPath.length ; i++ ){
          if(repoLocalPath[i] == "/"){
            breakStringFrom = i;
          }
        }
        repoLocalPath = "..." + repoLocalPath.slice(breakStringFrom,repoLocalPath.length); 
      }
      document.getElementById("repo-name").innerHTML = repoLocalPath;
      document.getElementById("branch-name").innerHTML = branch + '<span class="caret"></span>';
    }, function (err) {
      //If the repository has no commits, getCurrentBranch will throw an error.
      //Default values will be set for the branch labels
      window.alert("Warning:\n" +
        "No branches have been found in this repository.\n" +
        "This is likely because there have been no commits made.");
      console.log("No branches found. Setting default label values to master");
      console.log("Updating the labels and graph");
      drawGraph();
      document.getElementById("repo-name").innerHTML = repoLocalPath;
      //default label set to master
      document.getElementById("branch-name").innerHTML = "master" + '<span class="caret"></span>';
    });
}

function getAllBranches() {
  let repos;
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      repos = repo;
      return repo.getReferenceNames(Git.Reference.TYPE.LISTALL);
    })
    .then(function (branchList) {
      clearBranchElement();
      for (let i = 0; i < branchList.length; i++) {
        console.log("branch discovered: " + branchList[i]);
        let bp = branchList[i].split("/");
        if (bp[1] !== "remotes") {
          displayBranch(bp[bp.length - 1], "branch-dropdown", "checkoutLocalBranch(this)");
        }
        Git.Reference.nameToId(repos, branchList[i]).then(function (oid) {
          // Use oid
          console.log("old id " + oid);
        });
      }
    });
}

function getOtherBranches() {
  let list;
  let repos;
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      repos = repo;
      return repo.getReferenceNames(Git.Reference.TYPE.LISTALL);
    })
    .then(function (branchList) {
      clearMergeElement();
      list = branchList;
    })
    .then(function () {
      return repos.getCurrentBranch()
    })
    .then(function (ref) {
      let name = ref.name().split("/");
      console.log("merging remote branch with tracked local branch");
      clearBranchElement();
      for (let i = 0; i < list.length; i++) {
        let bp = list[i].split("/");
        if (bp[1] !== "remotes" && bp[bp.length - 1] !== name[name.length - 1]) {
          displayBranch(bp[bp.length - 1], "merge-dropdown", "mergeLocalBranches(this)");
        }
      }
    })

}

function clearMergeElement() {
  let ul = document.getElementById("merge-dropdown");
  ul.innerHTML = '';
}

function clearBranchElement() {
  let ul = document.getElementById("branch-dropdown");
  let li = document.getElementById("create-branch");
  ul.innerHTML = '';
  ul.appendChild(li);
}

function displayBranch(name, id, onclick) {
  let ul = document.getElementById(id);
  let li = document.createElement("li");
  let a = document.createElement("a");
  a.setAttribute("href", "#");
  a.setAttribute("class", "list-group-item");
  a.setAttribute("onclick", onclick + ";event.stopPropagation()");
  li.setAttribute("role", "presentation")
  a.appendChild(document.createTextNode(name));
  a.innerHTML = name;
  li.appendChild(a);
  if (id == "branch-dropdown") {
    var isLocal = 0;
    var isRemote = 0;
    // Add a remote branch icon for remote branches
    Git.Repository.open(repoFullPath)
    .then(function(repo) {
      Git.Reference.list(repo).then(function(array) {
        if (array.includes("refs/remotes/origin/" + name)) {
            a.innerHTML += "<img src='./assets/remote-branch.png' width='20' height='20' align='right' title='Remote'>";
            isRemote = 1
        }
      })
    })
    // Add a local branch icon for local branches
    Git.Repository.open(repoFullPath)
    .then(function(repo) {
      repo.getBranch(name).then(function() {
        a.innerHTML += "<img src='./assets/local-branch.png' width='20' height='20' align='right' title='Local'>";
        isLocal = 1
      })
    })

    // Adding a delete button for each branch
    if (name.toLowerCase() != "master") {
      var button = document.createElement("Button");
      button.innerHTML = "Delete";
      button.classList.add('btn-danger');

      $(button).click(function () {
        // Only show valid delete branch button(s)
        if (isRemote && !isLocal) {
          document.getElementById("localDeleteButton").style.display = 'none';
          document.getElementById("remoteDeleteButton").style.display = '';
        }
        else if (isLocal && !isRemote) {
          document.getElementById("remoteDeleteButton").style.display = 'none';
          document.getElementById("localDeleteButton").style.display = '';
        }
        else{
          document.getElementById("localDeleteButton").style.display = '';
          document.getElementById("remoteDeleteButton").style.display = '';
        }      
        
        $('#branch-to-delete').val(name);
        document.getElementById("displayedBranchName").innerHTML = name;
        $('#delete-branch-modal').modal(); // Display delete branch warning modal
      });
      li.appendChild(button); // Add delete button to the branch dropdown list
    }
  }
  ul.appendChild(li);
}

function createDropDownFork(name, id, onclick) {
  let ul = document.getElementById(id);
  let button = document.createElement("div");
  let div = document.createElement("ul");
  let innerText = document.createTextNode("↨" + name + " (Forked List)");
  button.className = name;
  button.appendChild(innerText);
  div.setAttribute("id", name);
  div.setAttribute("role", "menu");
  div.setAttribute("class", "list-group")
  button.setAttribute("onclick", onclick)
  button.appendChild(div);
  ul.appendChild(button);
}

function checkoutLocalBranch(element) {
  let bn;
  let img = "<img"
  if (typeof element === "string") {
    bn = element;
  } else {
    bn = element.innerHTML;
  }
  if (bn.includes(img)) {
    bn = bn.substr(0, bn.lastIndexOf(img)) // remove local branch <img> tag from branch name string
    if (bn.includes(img)) {
      bn = bn.substr(0, bn.lastIndexOf(img)) // remove remote branch <img> tag from branch name string
    }
  }
  console.log("name of branch being checked out: " + bn);
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      displayModal("Drawing graph, please wait");
      addCommand("git checkout " + bn);
      repo.checkoutBranch("refs/heads/" + bn)
        .then(function () {
          refreshAll(repo);
        }, function (err) {
          console.log("repo.tx, line 271, cannot checkout local branch: " + err);
        });
    })
}

function checkoutRemoteBranch(element) {
  let bn;
  let img = "<img"
  if (typeof element === "string") {
    bn = element;
  } else {
    bn = element.innerHTML;
  }
  if (bn.includes(img)) {
    bn = bn.substr(0, bn.lastIndexOf(img)) // remove remote branch <img> tag from branch name string
    if (bn.includes(img)) {
      bn = bn.substr(0, bn.lastIndexOf(img))  // remove local branch <img> tag from branch name string
    }
  }
  console.log("current branch name: " + bn);
  let repos;
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      repos = repo;
      addCommand("git fetch");
      addCommand("git checkout -b " + bn);
      let cid = remoteName[bn];
      console.log("name of remote branch:  " + cid);
      return Git.Commit.lookup(repo, cid);
    })
    .then(function (commit) {
      console.log("commiting");
      return Git.Branch.create(repos, bn, commit, 0);
    })
    .then(function (code) {
      console.log("name of local branch " + bn);
      repos.mergeBranches(bn, "origin/" + bn)
        .then(function () {
          displayModal("Drawing graph, please wait");
          refreshAll(repos);
          console.log("Pull successful");
        });
    }, function (err) {
      console.log("repo.ts, line 306, could not pull from repository" + err);
    })
}

function updateLocalPath() {
  let fullLocalPath;
  // get the name of the repo from the usere entered URL
  let text = document.getElementById("repoClone").value;
  let splitText = text.split(/\.|:|\//);


  if (splitText[splitText.length -1] == "git") {
    // Get the path location for this local folder, and join it with the repo name (from the URL)
    fullLocalPath = require("path").join(__dirname, splitText[splitText.length - 2]); 
    updateRepoSaveText(fullLocalPath);
  } else {
    // Get the path location for this local folder, and join it with the repo name (from the URL)
    fullLocalPath = require("path").join(__dirname, splitText[splitText.length - 1]); 
    updateRepoSaveText(fullLocalPath);
  }
}

// This function updates the repoSave text field
function updateRepoSaveText(fullLocalPath) {
  document.getElementById("repoSave").value = fullLocalPath;
  document.getElementById("repoSave").text = fullLocalPath;
}

// This function helps display the users chosen folder location on repoSave
function chooseLocalPath() {
  if (document.getElementById("repoClone").value == null || document.getElementById("repoClone").value == "") {
    window.alert("Please enter the URL of the repository you wish to clone");
  } else {
    // get the name of the repo from the usere entered URL
    let text = document.getElementById("repoClone").value;
    let splitText = text.split(/\.|:|\//);
    let fullLocalPath;

    // get the users selected folder
    localPath = document.getElementById("dirPickerSaveNew").files[0].webkitRelativePath;
    fullLocalPath = document.getElementById("dirPickerSaveNew").files[0].path;

    // display the new folder location on repoSave text field 
    updateRepoSaveText(fullLocalPath);
  }
}

// function initModal() {
//   modal = document.getElementById("modal");
//   btn = document.getElementById("new-repo-button");
//   confirmBtn = document.getElementById("confirm-button");
//   span = document.getElementsByClassName("close")[0];
// }

// function handleModal() {
//   // When the user clicks on <span> (x), close the modal
//   span.onclick = function() {
//     modal.style.display = "none";
//   };
//
//   // When the user clicks anywhere outside of the modal, close it
//   window.onclick = function(event) {
//
//     if (event.target === modal) {
//       modal.style.display = "none";
//     }
//   };
// }

function displayModal(text) {
//  initModal();
//  handleModal();
  document.getElementById("modal-text-box").innerHTML = text;
  $('#modal').modal('show');
}

function updateModalText(text) {
  document.getElementById("modal-text-box").innerHTML = text;
  $('#modal').modal('show');
}
