const { execSync } = require('child_process')
const fs = require('fs')


var ApiBuilder = require('claudia-api-builder'),
  api = new ApiBuilder();

module.exports = api;

api.get('/hello', function () {
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
  
    execSync('cat /tmp/id_rsa', { encoding: 'utf8', stdio: 'inherit' })

    execSync('git clone --depth 1 ssh://git@github.com/igorT/data-orbit.git /tmp/data-orbit', { encoding: 'utf8', stdio: 'inherit' })

    execSync('cd /tmp/data-orbit && git checkout -b lambda && git push --set-upstream origin lambda', { encoding: 'utf8', stdio: 'inherit' })
  
    return execSync('ls /tmp/aws4', { encoding: 'utf8' }).split('\n')
});
