package umm3601.inventory_items;

//import static com.mongodb.client.model.Filters.eq;
import static org.junit.jupiter.api.Assertions.assertEquals;
//import static org.junit.jupiter.api.Assertions.assertNotEquals;
//import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
//import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
//import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
//import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
//import java.util.HashMap;
import java.util.List;
import java.util.Map;
//import java.util.stream.Collectors;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
//import org.mockito.ArgumentMatcher;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

//import com.fasterxml.jackson.core.JsonProcessingException;
//import com.fasterxml.jackson.databind.JsonMappingException;
import com.mongodb.MongoClientSettings;
import com.mongodb.ServerAddress;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;

import io.javalin.Javalin;
import io.javalin.http.BadRequestResponse;
import io.javalin.http.Context;
import io.javalin.http.HttpStatus;
import io.javalin.http.NotFoundResponse;
import io.javalin.json.JavalinJackson;
//import io.javalin.validation.BodyValidator;
//import io.javalin.validation.Validation;
//import io.javalin.validation.ValidationError;
//import io.javalin.validation.ValidationException;
//import io.javalin.validation.Validator;

@SuppressWarnings({"MagicNumber"})
class InventoryItemControllerSpec {

    private InventoryItemController inventoryItemController;

    private ObjectId testItemId1;

    private static MongoClient mongoClient;
    private static MongoDatabase testDatabase;

    private static JavalinJackson javalinJackson = new JavalinJackson();

    @Mock
    private Context ctx;

    @Captor
    private ArgumentCaptor<ArrayList<InventoryItem>> inventoryItemArrayCaptor;

    @Captor
    private ArgumentCaptor<InventoryItem> inventoryItemCaptor;

    @Captor
    private ArgumentCaptor<Map<String, String>> mapCaptor;

    @BeforeAll
    static void setupAll() {
        String mongoAddr = System.getenv().getOrDefault("MONGO_ADDR", "localhost");

        mongoClient = MongoClients.create(
            MongoClientSettings.builder()
                .applyToClusterSettings(builder ->
                    builder.hosts(Arrays.asList(new ServerAddress(mongoAddr))))
                .build());
        testDatabase = mongoClient.getDatabase("test");
    }

    @AfterAll
    static void tearDownAll() {
        testDatabase.drop();
        mongoClient.close();
    }

    @BeforeEach
    void setupEach() throws IOException {
        MockitoAnnotations.openMocks(this);

        MongoCollection<Document> inventoryItemDocuments = testDatabase.getCollection("inventory_items");
        inventoryItemDocuments.drop();
        List<Document> testInventoryItems = new ArrayList<>();
        testInventoryItems.add(
            new Document()
                .append("name", "Pencil")
                .append("type", "pencil")
                .append("desc", "A wooden pencil with a graphite core.")
                .append("location", "Aisle 3, Shelf B")
                .append("stocked", 100));
        testInventoryItems.add(
            new Document()
                .append("name", "Notebook")
                .append("type", "notebook")
                .append("desc", "A spiral-bound notebook with lined paper.")
                .append("location", "Aisle 3, Shelf C")
                .append("stocked", 50));
        testInventoryItems.add(
            new Document()
                .append("name", "Eraser")
                .append("type", "eraser")
                .append("desc", "A pink eraser for removing pencil marks.")
                .append("location", "Aisle 3, Shelf B")
                .append("stocked", 120));

        testItemId1 = new ObjectId();
        Document marker = new Document()
            .append("_id", testItemId1)
            .append("name", "Marker")
            .append("type", "marker")
            .append("desc", "A black permanent marker.")
            .append("location", "Aisle 3, Shelf D")
            .append("stocked", 30);

        inventoryItemDocuments.insertMany(testInventoryItems);
        inventoryItemDocuments.insertOne(marker);

        inventoryItemController = new InventoryItemController(testDatabase);
    }

    @Test
    void addsRoutes() {
        Javalin mockServer = mock(Javalin.class);
        inventoryItemController.addRoutes(mockServer);
        verify(mockServer, Mockito.atLeast(2)).get(any(), any()); //getItem, get Items
        // verify(mockServer, Mockito.atLeastOnce()).post(any(), any());
        // verify(mockServer, Mockito.atLeastOnce()).delete(any(), any());
    }

    @Test
    void canGetAllInventoryItems() throws IOException {
        when(ctx.queryParamMap()).thenReturn(Collections.emptyMap());
        inventoryItemController.getItems(ctx);
        verify(ctx).json(inventoryItemArrayCaptor.capture());
        verify(ctx).status(HttpStatus.OK);

        assertEquals(
            testDatabase.getCollection("inventory_items").countDocuments(),
            inventoryItemArrayCaptor.getValue().size());
    }

    @Test
    void getItemWithExistentId() throws IOException {
      String id = testItemId1.toHexString();
      when(ctx.pathParam("id")).thenReturn(id);

      inventoryItemController.getItem(ctx);

      verify(ctx).json(inventoryItemCaptor.capture());
      verify(ctx).status(HttpStatus.OK);
      assertEquals("Marker", inventoryItemCaptor.getValue().name);
      assertEquals(testItemId1.toHexString(), inventoryItemCaptor.getValue()._id);
    }

  @Test
  void getItemWithBadId() throws IOException {
    when(ctx.pathParam("id")).thenReturn("bad! bad id!");

    Throwable exception = assertThrows(BadRequestResponse.class, () -> {
      inventoryItemController.getItem(ctx);
    });

    assertEquals("The requested item id wasn't a legal Mongo Object ID.", exception.getMessage());
  }

  //Not sure how often we're going to be getting single items, but might as well test it anyways.
  @Test
    void getItemWithNonexistentId() throws IOException {
      String id = "588935f5c668650dc77df581";
      when(ctx.pathParam("id")).thenReturn(id);

      Throwable exception = assertThrows(NotFoundResponse.class, () -> {
        inventoryItemController.getItem(ctx);
      });

      assertEquals("The requested item was not found", exception.getMessage());
    }

    //The controller is no longer responsible for filtering things by stock. Filtering is done client side.
    // @Test
    // void canGetInventoryItemWith100Stocked() throws IOException {
    //     Integer targetStocked = 100;
    //     String targetStockedStr = targetStocked.toString();

    //     Map<String, List<String>> queryParams = new HashMap<>();

    //     queryParams.put(inventoryItemController.STOCKED_KEY, Arrays.asList(new String[] {targetStockedStr}));
    //     when(ctx.queryParamMap()).thenReturn(queryParams);
    //     when(ctx.queryParam(inventoryItemController.STOCKED_KEY)).thenReturn(targetStockedStr);

    //     // Validation validation = new Validation();

    //     // Validator<Integer> validator = validation.validator(
    //     //    inventoryItemController.STOCKED_KEY,
    //     //    Integer.class,
    //     //    targetStockedStr
    //     //   );

    //     // when(ctx.queryParamAsClass(inventoryItemController.STOCKED_KEY, Integer.class))
    //     //         .thenReturn(validator);

    //     inventoryItemController.getItems(ctx);

    //     verify(ctx).json(inventoryItemArrayCaptor.capture());
    //     verify(ctx).status(HttpStatus.OK);

    //     assertEquals(2, inventoryItemArrayCaptor.getValue().size());

    //     for (InventoryItem item : inventoryItemArrayCaptor.getValue()) {
    //         assertTrue(item.stocked >= targetStocked); //Any value over 100 should be returned.
    //     }

    //     List<String> itemNames = inventoryItemArrayCaptor.getValue().stream()
    //         .map(item -> item.name)
    //         .collect(Collectors.toList());

    //     assertTrue(itemNames.contains("Pencil"));
    //     assertTrue(itemNames.contains("Eraser"));
    // }
}
