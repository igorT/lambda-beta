const { execSync } = require('child_process')
const fs = require('fs')
const fetch = require('node-fetch')

var ApiBuilder = require('claudia-api-builder'),
  api = new ApiBuilder();

module.exports = api;

api.post('/pushed', async function (request) {
  let ssh = process.env.ssh;

  execSync('rm -rf /tmp/*', { encoding: 'utf8', stdio: 'inherit' })
  fs.writeFileSync('/tmp/known_hosts', 'github.com,192.30.252.*,192.30.253.*,192.30.254.*,192.30.255.* ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAq2A7hRGmdnm9tUDbO9IDSwBK6TbQa+PXYPCPy6rbTrTtw7PHkccKrpp0yVhp5HdEIcKr6pLlVDBfOLX9QUsyCOV0wzfjIJNlGEYsdlLJizHhbn2mUjvSAHQqZETYP81eFzLQNnPHt4EVVUh7VfDESU84KezmD5QlWpXLmvU31/yMf+Se8xhHTvKSCZIFImWwoG6mbUoWf9nzpIoaSjB+weqqUUmpaaasXVal72J+UX2B+2RPW3RcT0eOzQgqlJL3RKrTJvdsjE3JEAvGq3lGHSZXy28G3skua2SmVi/w4yCE6gbODqnTWlg7+wC604ydGXA8VJiS5ap43JXiUFFAaQ==')

  // Get this from a safe place, say SSM
  fs.writeFileSync('/tmp/id_rsa', `-----BEGIN OPENSSH PRIVATE KEY-----
${ssh.split(' ').join('\n')}
-----END OPENSSH PRIVATE KEY-----
`);

  execSync('chmod 400 /tmp/id_rsa', { encoding: 'utf8', stdio: 'inherit' })

  process.env.GIT_SSH_COMMAND = 'ssh -o UserKnownHostsFile=/tmp/known_hosts -i /tmp/id_rsa'

  execSync('git clone ssh://git@github.com/igorT/data-orbit.git /tmp/data-orbit', { encoding: 'utf8', stdio: 'inherit' })
  execSync('cd /tmp/data-orbit &&   git config user.email "lambda+terzicigor@gmail.com"', { encoding: 'utf8', stdio: 'inherit' })
  execSync('cd /tmp/data-orbit && git config user.name "lambda beta bot"', { encoding: 'utf8', stdio: 'inherit' })
  //execSync(`cd /tmp/data-orbit && git remote update && git fetch origin`, { encoding: 'utf8', stdio: 'inherit' })

  let tmpBranchName;
  if (request.body.ref === 'refs/heads/master') {
    let commits = request.body.commits;
    for (let i = 0; i < commits.length; i++) {
      let commit = commits[i];
      if (commit.message.indexOf('BETA') > -1) {
        tmpBranchName = `lambda-beta/${(Math.random() + "").slice(-7)}`;
        execSync(`cd /tmp/data-orbit && git checkout beta && git checkout -b ${tmpBranchName} && git cherry-pick -x ${commit.id}   && git push origin ${tmpBranchName}`, { encoding: 'utf8', stdio: 'inherit' });
        let result = await fetch(`https://api.github.com/repos/igorT/data-orbit/pulls`,
          {
            method: 'POST',
            headers: {
              'Authorization': `token  ${process.env.github_api_key}`
            },
            body: `{"title": "Keeping beta up to date", "head": "${tmpBranchName}", "base": "beta"}`
          });
        let pr = await result.json();
        console.log('PR', pr);
        result = await fetch(`https://api.github.com/repos/igorT/data-orbit/issues/${pr.number}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `token ${process.env.github_api_key}`
            },
            body: '{ "labels": ["bot_automerge"]}'
          });
      }
    }
  }
  return request.body;
});


api.post('/ci', async function (request) {
  let ssh = process.env.ssh;

  execSync('rm -rf /tmp/*', { encoding: 'utf8', stdio: 'inherit' })
  fs.writeFileSync('/tmp/known_hosts', 'github.com,192.30.252.*,192.30.253.*,192.30.254.*,192.30.255.* ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAq2A7hRGmdnm9tUDbO9IDSwBK6TbQa+PXYPCPy6rbTrTtw7PHkccKrpp0yVhp5HdEIcKr6pLlVDBfOLX9QUsyCOV0wzfjIJNlGEYsdlLJizHhbn2mUjvSAHQqZETYP81eFzLQNnPHt4EVVUh7VfDESU84KezmD5QlWpXLmvU31/yMf+Se8xhHTvKSCZIFImWwoG6mbUoWf9nzpIoaSjB+weqqUUmpaaasXVal72J+UX2B+2RPW3RcT0eOzQgqlJL3RKrTJvdsjE3JEAvGq3lGHSZXy28G3skua2SmVi/w4yCE6gbODqnTWlg7+wC604ydGXA8VJiS5ap43JXiUFFAaQ==')

  // Get this from a safe place, say SSM
  fs.writeFileSync('/tmp/id_rsa', `-----BEGIN OPENSSH PRIVATE KEY-----
${ssh.split(' ').join('\n')}
-----END OPENSSH PRIVATE KEY-----
`);

  execSync('chmod 400 /tmp/id_rsa', { encoding: 'utf8', stdio: 'inherit' })

  process.env.GIT_SSH_COMMAND = 'ssh -o UserKnownHostsFile=/tmp/known_hosts -i /tmp/id_rsa'

  /*
  execSync('git clone ssh://git@github.com/igorT/data-orbit.git /tmp/data-orbit', { encoding: 'utf8', stdio: 'inherit' })
  execSync('cd /tmp/data-orbit &&   git config user.email "lambda+terzicigor@gmail.com"', { encoding: 'utf8', stdio: 'inherit' })
  execSync('cd /tmp/data-orbit && git config user.name "lambda beta bot"', { encoding: 'utf8', stdio: 'inherit' })
  //execSync(`cd /tmp/data-orbit && git remote update && git fetch origin`, { encoding: 'utf8', stdio: 'inherit' })

  let tmpBranchName;
  */
  console.log(JSON.stringify(request.body));

  let prs = request.body.check_suite.pull_requests;
  let pr, prData, result;
  for (let i = 0; i < prs.length; i++) {
    pr = prs[i];
    result = await fetch(`https://api.github.com/repos/igorT/data-orbit/pulls/${pr.number}`);
    prData = await result.json();

    console.log(prData);
    let hasLabel = false;
    prData.labels.forEach((label) => {
      if (label.name === 'bot_automerge') {
        hasLabel = true;
      }
    })
    console.log('label: ', hasLabel);
    if (prData.mergeable_state === 'clean' && hasLabel) {
      console.log('inside merge');
      execSync(`curl -H "Authorization: token ${process.env.github_api_key}" --request PUT  https://api.github.com/repos/igorT/data-orbit/pulls/${pr.number}/merge`);
    }
  }
  return request.body;
});
