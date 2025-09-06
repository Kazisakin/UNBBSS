const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportExistingData() {
  try {
    console.log('Exporting existing data...');
    
    // Create backups directory if it doesn't exist
    const backupsDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
      console.log('Created backups directory');
    }
    
    // Export current admins
    const existingAdmins = await prisma.admin.findMany();
    fs.writeFileSync(path.join(backupsDir, 'existing_admins.json'), JSON.stringify(existingAdmins, null, 2));
    
    // Export other critical data
    const nominationEvents = await prisma.nominationEvent.findMany();
    fs.writeFileSync(path.join(backupsDir, 'nomination_events.json'), JSON.stringify(nominationEvents, null, 2));
    
    const votingEvents = await prisma.votingEvent.findMany();
    fs.writeFileSync(path.join(backupsDir, 'voting_events.json'), JSON.stringify(votingEvents, null, 2));
    
    // Export nominations and votes if they exist
    try {
      const nominations = await prisma.nomination.findMany();
      fs.writeFileSync(path.join(backupsDir, 'nominations.json'), JSON.stringify(nominations, null, 2));
    } catch (e) {
      console.log('No nominations to export');
    }
    
    try {
      const votes = await prisma.vote.findMany();
      fs.writeFileSync(path.join(backupsDir, 'votes.json'), JSON.stringify(votes, null, 2));
    } catch (e) {
      console.log('No votes to export');
    }
    
    console.log('Data exported successfully to backups/ directory');
    console.log(`Found ${existingAdmins.length} admins to migrate`);
    console.log(`Found ${nominationEvents.length} nomination events`);
    console.log(`Found ${votingEvents.length} voting events`);
    
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportExistingData();