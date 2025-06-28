const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myst_admin');

// Define Interest Schema
const interestSchema = new mongoose.Schema({
  interest: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  versionKey: false,
  timestamps: true,
});

const InterestModel = mongoose.models.Interest || mongoose.model('Interest', interestSchema);

// Default interests
const defaultInterests = [
  { interest: 'Technology', description: 'Tech-related content and innovations' },
  { interest: 'Fashion', description: 'Fashion and style content' },
  { interest: 'Food', description: 'Culinary content and recipes' },
  { interest: 'Travel', description: 'Travel and adventure content' },
  { interest: 'Fitness', description: 'Health and fitness content' },
  { interest: 'Music', description: 'Music and entertainment content' },
  { interest: 'Art', description: 'Artistic and creative content' },
  { interest: 'Business', description: 'Business and entrepreneurship content' },
  { interest: 'Education', description: 'Educational and learning content' },
  { interest: 'Sports', description: 'Sports and athletic content' },
  { interest: 'Lifestyle', description: 'General lifestyle content' },
  { interest: 'Gaming', description: 'Gaming and esports content' },
  { interest: 'Beauty', description: 'Beauty and cosmetics content' },
  { interest: 'Pets', description: 'Pet and animal content' },
  { interest: 'DIY', description: 'Do-it-yourself and crafts content' },
  { interest: 'Photography', description: 'Photography and visual arts' },
  { interest: 'Comedy', description: 'Humor and comedy content' },
  { interest: 'News', description: 'Current events and news' },
  { interest: 'Science', description: 'Scientific discoveries and research' },
  { interest: 'Nature', description: 'Nature and environmental content' },
];

async function seedInterests() {
  try {
    console.log('Starting to seed interests...');
    
    // Clear existing interests
    await InterestModel.deleteMany({});
    console.log('Cleared existing interests');
    
    // Insert new interests
    const result = await InterestModel.insertMany(defaultInterests);
    console.log(`Successfully seeded ${result.length} interests:`);
    
    result.forEach(interest => {
      console.log(`- ${interest.interest}: ${interest.description}`);
    });
    
    console.log('Interest seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding interests:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seeding function
seedInterests(); 